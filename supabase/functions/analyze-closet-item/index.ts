import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image:", imageUrl);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a fashion expert AI analyzing clothing items with special attention to modest and hijab-friendly fashion. Analyze the image and provide a detailed JSON response.

Be specific and accurate. Consider coverage level, formality, and whether items are suitable for modest dressing.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this clothing item in detail."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_clothing",
              description: "Analyze clothing item and return structured data",
              parameters: {
                type: "object",
                properties: {
                  item_type: {
                    type: "string",
                    enum: ["top", "bottom", "dress", "outerwear", "shoes", "accessory"]
                  },
                  category: { 
                    type: "string",
                    description: "Specific category like blazer, jeans, midi dress"
                  },
                  color_primary: { type: "string" },
                  color_secondary: { type: "string" },
                  pattern: {
                    type: "string",
                    enum: ["solid", "striped", "floral", "geometric", "abstract", "none"]
                  },
                  style: {
                    type: "string",
                    enum: ["casual", "formal", "business", "evening", "sporty"]
                  },
                  season: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["spring", "summer", "fall", "winter"]
                    }
                  },
                  suitable_occasions: {
                    type: "array",
                    items: { type: "string" }
                  },
                  formality_level: {
                    type: "integer",
                    minimum: 1,
                    maximum: 5
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" }
                  },
                  hijab_friendly: { type: "boolean" },
                  modest_coverage: {
                    type: "string",
                    enum: ["high", "medium", "low"]
                  },
                  brand: { type: "string" },
                  name: { type: "string" }
                },
                required: ["item_type", "category", "color_primary", "pattern", "style", "season", "suitable_occasions", "formality_level", "tags", "hijab_friendly", "modest_coverage", "name"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_clothing" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "analyze_clothing") {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log("Parsed analysis:", analysis);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-closet-item:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
