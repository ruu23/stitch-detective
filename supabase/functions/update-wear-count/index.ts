import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { itemIds } = await req.json();
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid itemIds array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating wear count for ${itemIds.length} items`);

    // Update wear count for each item and recalculate cost per wear
    const updates = await Promise.all(itemIds.map(async (itemId) => {
      // Get current item data
      const { data: item, error: fetchError } = await supabase
        .from('closet_items')
        .select('wear_count, price_paid')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !item) {
        console.error(`Error fetching item ${itemId}:`, fetchError);
        return { id: itemId, success: false, error: fetchError?.message };
      }

      const newWearCount = (item.wear_count || 0) + 1;
      const costPerWear = item.price_paid && item.price_paid > 0 
        ? item.price_paid / newWearCount 
        : null;

      // Update the item
      const { error: updateError } = await supabase
        .from('closet_items')
        .update({
          wear_count: newWearCount,
          cost_per_wear: costPerWear
        })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Error updating item ${itemId}:`, updateError);
        return { id: itemId, success: false, error: updateError.message };
      }

      console.log(`Updated item ${itemId}: wear_count=${newWearCount}, cost_per_wear=${costPerWear}`);
      return { 
        id: itemId, 
        success: true, 
        wear_count: newWearCount,
        cost_per_wear: costPerWear
      };
    }));

    const successCount = updates.filter(u => u.success).length;
    const failedCount = updates.length - successCount;

    return new Response(
      JSON.stringify({ 
        message: `Updated ${successCount} items successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        updates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in update-wear-count:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
