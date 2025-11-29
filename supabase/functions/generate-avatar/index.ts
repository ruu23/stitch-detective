import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { frontImageUrl, sideImageUrl, faceImageUrl, bodyScanId } = await req.json();

    console.log('Starting avatar generation for user:', user.id);

    // Step 1: Use Lovable AI to analyze the photos
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: frontImageUrl } },
              { type: "image_url", image_url: { url: faceImageUrl } },
              { type: "image_url", image_url: { url: sideImageUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI analysis failed:", errorText);
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);
    console.log('AI Analysis complete:', analysis);

    // Step 2: Generate avatar with Ready Player Me
    const RPM_API_KEY = Deno.env.get("READY_PLAYER_ME_API_KEY");
    if (!RPM_API_KEY) {
      throw new Error("READY_PLAYER_ME_API_KEY not configured");
    }

    // Create avatar using Ready Player Me API
    const avatarResponse = await fetch("https://api.readyplayer.me/v1/avatars", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RPM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        partner: "lovable-ai",
        bodyType: "fullbody",
        assets: {
          skin: {
            color: analysis.skin_tone_hex
          }
        }
      }),
    });

    if (!avatarResponse.ok) {
      const errorText = await avatarResponse.text();
      console.error("Ready Player Me avatar creation failed:", errorText);
      throw new Error("Avatar creation failed");
    }

    const avatarData = await avatarResponse.json();
    const avatarUrl = avatarData.data.url;
    console.log('Avatar created:', avatarUrl);

    // Step 3: Store avatar data in database
    const { data: avatar, error: avatarError } = await supabaseClient
      .from('avatars')
      .upsert({
        user_id: user.id,
        avatar_model_url: avatarUrl,
        avatar_thumbnail_url: `${avatarUrl}?preview=true`,
        skin_tone_hex: analysis.skin_tone_hex,
        hair_color: analysis.hair_color,
        hair_style: analysis.hair_style,
        face_features: analysis.facial_features,
        body_shape_params: analysis.body_proportions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (avatarError) {
      console.error('Database error:', avatarError);
      throw avatarError;
    }

    console.log('Avatar data saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        avatar: {
          id: avatar.id,
          model_url: avatar.avatar_model_url,
          thumbnail_url: avatar.avatar_thumbnail_url,
          analysis: {
            skin_tone: analysis.skin_tone_hex,
            hair_color: analysis.hair_color,
            hair_style: analysis.hair_style,
            face_shape: analysis.face_shape,
            eye_color: analysis.eye_color
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Avatar generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});