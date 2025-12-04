import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      return new Response(
        JSON.stringify({ error: 'Missing required image URLs' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Analyzing body shape with Anthropic Claude...');

    // Fetch and convert images to base64
    const fetchAndConvert = async (url: string) => {
      console.log('Fetching image:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
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
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: frontImage.mediaType,
                  data: frontImage.base64
                }
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: sideImage.mediaType,
                  data: sideImage.base64
                }
              },
              {
                type: 'text',
                text: analyzeBodyPrompt
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze body shape with AI' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log('Received response from Anthropic');
    
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.error('No content in Anthropic response');
      return new Response(
        JSON.stringify({ error: 'No content in AI response' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    let analysis;
    try {
      const jsonText = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          details: content
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Successfully analyzed body shape:', analysis);
    
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
