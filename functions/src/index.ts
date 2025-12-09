import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Analyze Closet Item - Uses AI to analyze clothing images
export const analyzeClosetItem = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { imageUrl } = data;
  
  if (!imageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing imageUrl parameter');
  }

  const LOVABLE_API_KEY = functions.config().lovable?.api_key;
  
  if (!LOVABLE_API_KEY) {
    throw new functions.https.HttpsError('failed-precondition', 'AI service not configured');
  }

  const analyzeClothingPrompt = `Analyze this clothing item image and return ONLY a valid JSON object (no markdown, no backticks, no explanation) with these exact fields:

{
  "item_type": "top/bottom/dress/outerwear/shoes/accessory/bag",
  "category": "specific category like blazer, jeans, midi dress, sneakers, handbag",
  "color_primary": "main color name",
  "color_secondary": "secondary color or null",
  "pattern": "solid/striped/floral/geometric/abstract/plaid/none",
  "style": "casual/formal/business/evening/sporty/bohemian",
  "season": ["spring", "summer", "fall", "winter"],
  "suitable_occasions": ["work", "casual", "evening", "weekend", "formal", "party"],
  "formality_level": 1-5,
  "brand": "estimated brand or null",
  "name": "descriptive name for the item",
  "tags": ["descriptive", "style", "tags"],
  "hijab_friendly": true/false,
  "modest_coverage": "high/medium/low"
}

Be accurate and specific. For hijab_friendly, return true if the item provides modest coverage (long sleeves, high neck, loose fit) or false if it's revealing. Return ONLY the JSON.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: analyzeClothingPrompt }
            ]
          }
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new functions.https.HttpsError('internal', 'Failed to analyze image with AI');
    }
    
    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new functions.https.HttpsError('internal', 'No content in AI response');
    }
    
    // Parse the JSON response
    let jsonText = content.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    const analysis = JSON.parse(jsonText);
    
    // Map item_type to valid category enum
    const categoryMap: Record<string, string> = {
      'top': 'tops',
      'bottom': 'bottoms',
      'dress': 'dresses',
      'outerwear': 'outerwear',
      'shoes': 'shoes',
      'accessory': 'accessories',
      'bag': 'bags',
    };
    
    analysis.category = categoryMap[analysis.item_type] || 'accessories';
    
    return { analysis };
  } catch (error) {
    console.error('Error analyzing closet item:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Analyze Body Shape - Uses AI to analyze body photos
export const analyzeBodyShape = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { frontImageUrl, sideImageUrl } = data;
  
  if (!frontImageUrl || !sideImageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required image URLs');
  }

  const ANTHROPIC_API_KEY = functions.config().anthropic?.api_key;
  
  if (!ANTHROPIC_API_KEY) {
    throw new functions.https.HttpsError('failed-precondition', 'API key not configured');
  }

  try {
    // Fetch and convert images to base64
    const fetchAndConvert = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mediaType = response.headers.get('content-type') || 'image/jpeg';
      return { base64, mediaType };
    };

    const [frontImage, sideImage] = await Promise.all([
      fetchAndConvert(frontImageUrl),
      fetchAndConvert(sideImageUrl)
    ]);

    const analyzeBodyPrompt = `Analyze these body images (front and side view) and provide detailed body shape analysis.

Return ONLY a valid JSON object (no markdown, no backticks) with these measurements and characteristics:

{
  "body_shape": "hourglass/pear/apple/rectangle/inverted_triangle",
  "height_cm": estimated height in centimeters,
  "measurements": {
    "bust": estimated bust measurement in cm,
    "waist": estimated waist measurement in cm,
    "hips": estimated hip measurement in cm,
    "shoulder_width": estimated shoulder width in cm,
    "inseam": estimated inseam length in cm
  },
  "skin_tone_hex": "#RRGGBB color hex code",
  "skin_undertone": "warm/cool/neutral",
  "hair_color": "description of hair color",
  "proportions": {
    "torso_to_leg_ratio": "short/average/long",
    "shoulder_to_hip_ratio": description
  },
  "recommendations": {
    "best_fits": ["style recommendations based on body shape"],
    "styling_tips": ["specific tips for this body type"]
  }
}

Be as accurate as possible with measurements and provide helpful styling advice.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: frontImage.mediaType, data: frontImage.base64 } },
              { type: 'image', source: { type: 'base64', media_type: sideImage.mediaType, data: sideImage.base64 } },
              { type: 'text', text: analyzeBodyPrompt }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new functions.https.HttpsError('internal', 'Failed to analyze body shape with AI');
    }
    
    const aiData = await response.json();
    const content = aiData.content?.[0]?.text;
    
    if (!content) {
      throw new functions.https.HttpsError('internal', 'No content in AI response');
    }
    
    const jsonText = content.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error analyzing body shape:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Generate Outfit Recommendations
export const generateOutfitRecommendations = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { occasion } = data;

  try {
    // Get user profile
    const profileDoc = await db.collection('profiles').doc(userId).get();
    if (!profileDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Profile not found');
    }
    const profile = profileDoc.data()!;

    // Get closet items
    const closetSnapshot = await db.collection('closetItems')
      .where('userId', '==', userId)
      .get();
    
    if (closetSnapshot.empty) {
      return { error: 'No closet items found', recommendations: [] };
    }

    const closetItems = closetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get body scan data
    const bodyScanSnapshot = await db.collection('bodyScans')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    const bodyScan = bodyScanSnapshot.empty ? null : bodyScanSnapshot.docs[0].data();

    // Filter items by occasion and preferences
    const filteredItems = closetItems.filter((item: any) => {
      if (profile.isVeiled && !item.hijabFriendly) return false;
      if (item.suitableOccasions && item.suitableOccasions.length > 0) {
        return item.suitableOccasions.some((occ: string) => 
          occ.toLowerCase().includes(occasion.toLowerCase()) || 
          occasion.toLowerCase().includes(occ.toLowerCase())
        );
      }
      return true;
    });

    if (filteredItems.length === 0) {
      return { error: 'No suitable items found for this occasion', recommendations: [] };
    }

    const ANTHROPIC_API_KEY = functions.config().anthropic?.api_key;
    if (!ANTHROPIC_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'ANTHROPIC_API_KEY not configured');
    }

    const itemsList = filteredItems.map((item: any) => ({
      id: item.id,
      type: item.category,
      color: item.colorPrimary,
      style: item.style,
      formality: item.formalityLevel,
      pattern: item.pattern,
      hijabFriendly: item.hijabFriendly,
      modestCoverage: item.modestCoverage
    }));

    const aiPrompt = `You are an expert fashion stylist. Create 3 complete outfit combinations from these wardrobe items for a ${occasion} event.

AVAILABLE ITEMS:
${JSON.stringify(itemsList, null, 2)}

CONTEXT:
- User is ${profile.isVeiled ? 'veiled (wears hijab)' : 'not veiled'}
- Body shape: ${bodyScan?.bodyShape || 'Not specified'}

REQUIREMENTS:
1. Each outfit must be complete (top + bottom OR dress, plus appropriate shoes/accessories if available)
2. Colors should harmonize
3. Style should match the occasion formality
4. ${profile.isVeiled ? 'Ensure modest coverage for all items' : 'Consider flattering silhouettes'}

Return ONLY a JSON array (no markdown, no backticks):
[
  {
    "outfit_name": "Professional Elegance",
    "items": ["item_id_1", "item_id_2", "item_id_3"],
    "styling_notes": "Why this outfit works",
    "color_harmony": "How colors work together",
    "occasion_fit": "Why it's perfect for ${occasion}"
  }
]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: aiPrompt }]
      }),
    });

    if (!response.ok) {
      throw new functions.https.HttpsError('internal', 'AI request failed');
    }

    const aiData = await response.json();
    const aiContent = aiData.content?.[0]?.text;
    
    const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
    const recommendations = JSON.parse(cleanContent);

    // Enrich with full item details
    const enrichedOutfits = recommendations.map((outfit: any) => {
      const outfitItems = outfit.items.map((itemId: string) => 
        filteredItems.find((item: any) => item.id === itemId)
      ).filter(Boolean);

      return { ...outfit, items: outfitItems, total_items: outfitItems.length };
    });

    return {
      recommendations: enrichedOutfits,
      userPreferences: {
        isVeiled: profile.isVeiled,
        bodyShape: bodyScan?.bodyShape
      },
      totalClosetItems: closetItems.length,
      filteredItemsCount: filteredItems.length
    };
  } catch (error) {
    console.error('Error generating outfit recommendations:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Generate Avatar
export const generateAvatar = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { frontImageUrl, sideImageUrl, faceImageUrl } = data;

  try {
    const LOVABLE_API_KEY = functions.config().lovable?.api_key;
    if (!LOVABLE_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'LOVABLE_API_KEY not configured');
    }

    const analysisPrompt = `Analyze these body scan photos and extract the following information in JSON format:
    {
      "skin_tone_hex": "exact hex color of skin tone",
      "hair_color": "natural hair color description",
      "hair_style": "hair style description",
      "face_shape": "face shape (oval, round, square, heart, diamond)",
      "eye_color": "eye color",
      "facial_features": {
        "nose_shape": "description",
        "lip_fullness": "description",
        "jawline": "description",
        "cheekbones": "description"
      },
      "body_proportions": {
        "estimated_height_cm": number,
        "shoulder_to_waist_ratio": number,
        "torso_length": "short/medium/long"
      }
    }`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: frontImageUrl } },
              { type: 'image_url', image_url: { url: faceImageUrl } },
              { type: 'image_url', image_url: { url: sideImageUrl } }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      throw new functions.https.HttpsError('internal', 'AI analysis failed');
    }

    const aiResult = await aiResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);

    // Generate avatar with Ready Player Me
    const RPM_API_KEY = functions.config().readyplayerme?.api_key;
    if (!RPM_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'READY_PLAYER_ME_API_KEY not configured');
    }

    const avatarResponse = await fetch('https://api.readyplayer.me/v1/avatars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RPM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partner: 'lovable-ai',
        bodyType: 'fullbody',
        assets: { skin: { color: analysis.skin_tone_hex } }
      }),
    });

    if (!avatarResponse.ok) {
      throw new functions.https.HttpsError('internal', 'Avatar creation failed');
    }

    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data.url;

    // Store avatar data in Firestore
    const avatarRef = db.collection('avatars').doc();
    await avatarRef.set({
      userId,
      avatarModelUrl: avatarUrl,
      avatarThumbnailUrl: `${avatarUrl}?preview=true`,
      skinToneHex: analysis.skin_tone_hex,
      hairColor: analysis.hair_color,
      hairStyle: analysis.hair_style,
      faceFeatures: analysis.facial_features,
      bodyShapeParams: analysis.body_proportions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      avatar: {
        id: avatarRef.id,
        modelUrl: avatarUrl,
        thumbnailUrl: `${avatarUrl}?preview=true`,
        analysis: {
          skinTone: analysis.skin_tone_hex,
          hairColor: analysis.hair_color,
          hairStyle: analysis.hair_style,
          faceShape: analysis.face_shape,
          eyeColor: analysis.eye_color
        }
      }
    };
  } catch (error) {
    console.error('Avatar generation error:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Update Wear Count
export const updateWearCount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { itemIds } = data;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid itemIds array');
  }

  try {
    const updates = await Promise.all(itemIds.map(async (itemId: string) => {
      const itemRef = db.collection('closetItems').doc(itemId);
      const itemDoc = await itemRef.get();

      if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
        return { id: itemId, success: false, error: 'Item not found or access denied' };
      }

      const item = itemDoc.data()!;
      const newWearCount = (item.wearCount || 0) + 1;
      const costPerWear = item.pricePaid && item.pricePaid > 0 
        ? item.pricePaid / newWearCount 
        : null;

      await itemRef.update({
        wearCount: newWearCount,
        costPerWear
      });

      return { id: itemId, success: true, wearCount: newWearCount, costPerWear };
    }));

    const successCount = updates.filter(u => u.success).length;
    const failedCount = updates.length - successCount;

    return {
      message: `Updated ${successCount} items successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      updates
    };
  } catch (error) {
    console.error('Error updating wear count:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Accept Friend Request
export const acceptFriendRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { requestId } = data;

  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'Request ID is required');
  }

  try {
    const requestRef = db.collection('friendRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Friend request not found');
    }

    const friendRequest = requestDoc.data()!;

    if (friendRequest.receiverId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied');
    }

    if (friendRequest.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Friend request is not pending');
    }

    // Use a batch to atomically update the request and create friendships
    const batch = db.batch();

    // Update request status
    batch.update(requestRef, { status: 'accepted', updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Create bidirectional friendship records
    const friendship1Ref = db.collection('friendships').doc();
    batch.set(friendship1Ref, {
      userId: friendRequest.requesterId,
      friendId: friendRequest.receiverId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const friendship2Ref = db.collection('friendships').doc();
    batch.set(friendship2Ref, {
      userId: friendRequest.receiverId,
      friendId: friendRequest.requesterId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Unknown error');
  }
});
