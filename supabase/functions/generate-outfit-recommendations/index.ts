import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { occasion, date } = await req.json();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    console.log("Generating outfit recommendations for user:", user.id);

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error("Profile not found");

    // 2. Get closet items
    const { data: closetItems, error: itemsError } = await supabase
      .from("closet_items")
      .select("*")
      .eq("user_id", user.id);

    if (itemsError) throw itemsError;
    if (!closetItems || closetItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No closet items found",
          recommendations: [] 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get body scan data for body shape
    const { data: bodyScan } = await supabase
      .from("body_scans")
      .select("body_shape, measurements_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Filter items by occasion and preferences
    const filteredItems = closetItems.filter(item => {
      // Check hijab preference
      if (profile.is_veiled && !item.hijab_friendly) {
        return false;
      }
      
      // Check occasion
      if (item.suitable_occasions && item.suitable_occasions.length > 0) {
        return item.suitable_occasions.some((occ: string) => 
          occ.toLowerCase().includes(occasion.toLowerCase()) || 
          occasion.toLowerCase().includes(occ.toLowerCase())
        );
      }
      
      return true;
    });

    if (filteredItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No suitable items found for this occasion",
          recommendations: [] 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Use Anthropic Claude to generate outfit combinations
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const itemsList = filteredItems.map(item => ({
      id: item.id,
      type: item.category,
      category: item.category,
      color: item.color_primary,
      secondary_color: item.color_secondary,
      style: item.style,
      formality: item.formality_level,
      pattern: item.pattern,
      hijab_friendly: item.hijab_friendly,
      modest_coverage: item.modest_coverage
    }));

    const aiPrompt = `You are an expert fashion stylist. Create 3 complete outfit combinations from these wardrobe items for a ${occasion} event.

AVAILABLE ITEMS:
${JSON.stringify(itemsList, null, 2)}

CONTEXT:
- User is ${profile.is_veiled ? 'veiled (wears hijab)' : 'not veiled'}
- Body shape: ${bodyScan?.body_shape || 'Not specified'}
- Lifestyle: ${profile.lifestyle_type || 'Not specified'}

REQUIREMENTS:
1. Each outfit must be complete (top + bottom OR dress, plus appropriate shoes/accessories if available)
2. Colors should harmonize
3. Style should match the occasion formality
4. ${profile.is_veiled ? 'Ensure modest coverage for all items' : 'Consider flattering silhouettes'}
5. Create variety (don't repeat items across outfits if possible)

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

    console.log("Calling Anthropic Claude for outfit combinations...");

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: aiPrompt
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Anthropic AI error:", errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.content?.[0]?.text;

    if (!aiContent) throw new Error("No AI response received");

    console.log("AI Response:", aiContent);

    // Parse AI response
    let recommendations;
    try {
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      recommendations = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Failed to parse AI recommendations");
    }

    // Enrich recommendations with full item details
    const enrichedOutfits = recommendations.map((outfit: any) => {
      const outfitItems = outfit.items.map((itemId: string) => 
        filteredItems.find(item => item.id === itemId)
      ).filter(Boolean);

      return {
        ...outfit,
        items: outfitItems,
        total_items: outfitItems.length
      };
    });

    return new Response(
      JSON.stringify({
        recommendations: enrichedOutfits,
        user_preferences: {
          is_veiled: profile.is_veiled,
          body_shape: bodyScan?.body_shape,
          styling_preference: profile.styling_preference
        },
        total_closet_items: closetItems.length,
        filtered_items_count: filteredItems.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-outfit-recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
