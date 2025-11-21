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

    // 5. Use AI to generate outfit combinations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const itemsDescription = filteredItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      color_primary: item.color_primary,
      color_secondary: item.color_secondary,
      style: item.style,
      formality_level: item.formality_level,
      pattern: item.pattern,
      hijab_friendly: item.hijab_friendly,
      modest_coverage: item.modest_coverage
    }));

    const aiPrompt = `You are a professional fashion stylist. Create 5 complete outfit combinations from these closet items for a ${occasion} occasion.

User Profile:
- Is veiled: ${profile.is_veiled ? 'Yes' : 'No'}
- Body shape: ${bodyScan?.body_shape || 'Not specified'}
- Styling preference: ${profile.styling_preference || 'Not specified'}

Available items:
${JSON.stringify(itemsDescription, null, 2)}

Requirements:
1. Each outfit must include appropriate pieces for the occasion
2. Colors should harmonize well together
3. Style should be cohesive
4. ${profile.is_veiled ? 'All items must be hijab-friendly with modest coverage' : 'Consider body shape flattering silhouettes'}
5. Mix formal levels appropriately for the occasion

Return your response in this EXACT JSON format (no markdown, no extra text):
{
  "outfits": [
    {
      "outfit_name": "Elegant Evening Look",
      "items": ["<item_id>", "<item_id>", "<item_id>"],
      "reasoning": "Why this combination works",
      "color_harmony_score": 0.95,
      "style_cohesion_score": 0.90,
      "occasion_fit_score": 0.85,
      "missing_pieces": ["Optional: scarf", "Optional: belt"],
      "styling_tips": ["Tip 1", "Tip 2"]
    }
  ]
}`;

    console.log("Calling AI for outfit combinations...");

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
            content: aiPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

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
    const enrichedOutfits = recommendations.outfits.map((outfit: any) => {
      const outfitItems = outfit.items.map((itemId: string) => 
        filteredItems.find(item => item.id === itemId)
      ).filter(Boolean);

      return {
        ...outfit,
        items: outfitItems,
        total_items: outfitItems.length,
        is_complete: outfit.missing_pieces.length === 0,
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
