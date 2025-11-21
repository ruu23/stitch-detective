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
    const { frontImageUrl, sideImageUrl } = await req.json();

    if (!frontImageUrl || !sideImageUrl) {
      throw new Error("Both front and side image URLs are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing body shape with AI...");

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
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these body photos and provide detailed measurements and body shape analysis.

Front view photo and side view photo are provided.

Provide your analysis in this EXACT JSON format (no other text):
{
  "body_shape": "hourglass/pear/apple/rectangle/inverted_triangle",
  "estimated_measurements": {
    "bust": <number in cm>,
    "waist": <number in cm>,
    "hips": <number in cm>,
    "height": <number in cm>
  },
  "proportions": {
    "shoulder_to_waist": "short/average/long",
    "leg_length": "short/average/long"
  },
  "confidence_level": <number between 0 and 1>,
  "recommendations": ["style tip 1", "style tip 2", "style tip 3"]
}

Be as accurate as possible with measurements. Return ONLY the JSON, no markdown or other formatting.`
              },
              {
                type: "image_url",
                image_url: {
                  url: frontImageUrl
                }
              },
              {
                type: "image_url",
                image_url: {
                  url: sideImageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    console.log("AI Response:", content);

    // Parse the JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis response");
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-body-shape function:", error);
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
