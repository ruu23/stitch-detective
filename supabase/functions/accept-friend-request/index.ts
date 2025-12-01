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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { requestId } = await req.json();

    if (!requestId) {
      throw new Error("Request ID is required");
    }

    console.log(`User ${user.id} accepting friend request ${requestId}`);

    // Fetch the friend request to get requester and receiver IDs
    const { data: friendRequest, error: fetchError } = await supabase
      .from("friend_requests")
      .select("requester_id, receiver_id, status")
      .eq("id", requestId)
      .eq("receiver_id", user.id)
      .single();

    if (fetchError || !friendRequest) {
      throw new Error("Friend request not found or access denied");
    }

    if (friendRequest.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    // Use PostgreSQL transaction via RPC function
    const { error: rpcError } = await supabase.rpc('accept_friend_request_atomic', {
      p_request_id: requestId,
      p_requester_id: friendRequest.requester_id,
      p_receiver_id: friendRequest.receiver_id
    });

    if (rpcError) {
      console.error("Transaction error:", rpcError);
      throw new Error("Failed to accept friend request");
    }

    console.log(`Friend request ${requestId} accepted successfully`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in accept-friend-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
