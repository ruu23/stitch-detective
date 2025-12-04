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
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl parameter' }),
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

    console.log('Analyzing clothing item with Anthropic Claude...');
    
    const analyzeClothingPrompt = `Analyze this clothing item and return ONLY a valid JSON object (no markdown, no backticks) with these exact fields:

{
  "item_type": "top/bottom/dress/outerwear/shoes/accessory",
  "category": "specific category like blazer, jeans, midi dress, sneakers, handbag",
  "color_primary": "main color name",
  "color_secondary": "secondary color or null",
  "pattern": "solid/striped/floral/geometric/abstract/none",
  "style": "casual/formal/business/evening/sporty",
  "season": ["spring", "summer", "fall", "winter"],
  "suitable_occasions": ["work", "casual", "evening", "weekend", "formal"],
  "formality_level": 1-5,
  "brand": "estimated brand or null",
  "name": "descriptive name for the item",
  "tags": ["descriptive", "style", "tags"],
  "hijab_friendly": true/false,
  "modest_coverage": "high/medium/low"
}

Be accurate and specific. For hijab_friendly, return true if the item provides modest coverage (long sleeves, high neck, loose fit) or false if it's revealing.`;
    
    // Fetch the image and convert to base64
    console.log('Fetching image from URL:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Convert to base64 in chunks to avoid stack overflow on large images
    const uint8Array = new Uint8Array(imageBuffer);
    let base64Image = '';
    const chunkSize = 32768; // Process 32KB at a time
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      base64Image += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    base64Image = btoa(base64Image);
    
    console.log('Image fetched, size:', imageBuffer.byteLength, 'type:', contentType);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: contentType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: analyzeClothingPrompt
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
        JSON.stringify({ error: 'Failed to analyze image with AI' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log('Received response from Anthropic');
    
    // Extract the text content from Claude's response
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
    
    console.log('Parsing AI response...');
    
    // Parse the JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonText = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response content:', content);
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
    
    console.log('Successfully analyzed item:', analysis);
    
    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-closet-item:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
