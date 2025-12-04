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
      console.error('Missing imageUrl parameter');
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use Lovable AI Gateway (pre-configured, no API key needed from user)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Analyzing clothing item with Lovable AI...');
    console.log('Image URL:', imageUrl);
    
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
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: analyzeClothingPrompt
              }
            ]
          }
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image with AI', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log('Received response from Lovable AI');
    
    // Extract the text content from the response
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'No content in AI response' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Parsing AI response:', content.substring(0, 200));
    
    // Parse the JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      let jsonText = content.replace(/```json\n?|\n?```/g, '').trim();
      // Also try to extract JSON if there's extra text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response content:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          details: content.substring(0, 500)
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
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
    
    console.log('Successfully analyzed item:', analysis.name);
    
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
