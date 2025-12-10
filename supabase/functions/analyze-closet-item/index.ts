const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing image:", imageUrl);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use Lovable AI Gateway for clothing analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this clothing item image and return a JSON object with these exact fields:
{
  "name": "descriptive name of the item (e.g., 'Navy Blue Blazer', 'Floral Midi Dress')",
  "item_type": "specific type (e.g., 'blazer', 't-shirt', 'jeans', 'sneakers', 'handbag')",
  "category": "one of: tops, bottoms, dresses, outerwear, shoes, accessories, bags",
  "color_primary": "main color name",
  "color_secondary": "secondary color if any, or null",
  "pattern": "solid, striped, floral, plaid, geometric, abstract, animal print, or other",
  "style": "casual, formal, business, sporty, bohemian, minimalist, vintage, streetwear",
  "season": ["array of: spring, summer, fall, winter"],
  "suitable_occasions": ["array of occasions: work, casual, party, date, workout, beach, formal"],
  "formality_level": "number 1-5 (1=very casual, 5=very formal)",
  "hijab_friendly": "boolean - true if modest/appropriate for hijabi styling",
  "modest_coverage": "high, medium, or low",
  "brand": "brand name if visible, or null",
  "tags": ["array of descriptive tags for searchability"]
}

Return ONLY the JSON object, no additional text.`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", content);

    // Parse the JSON from the response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis");
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Analysis failed";
    console.error("Error analyzing closet item:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
