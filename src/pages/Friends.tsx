import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { Search, UserPlus, Users, Clock, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  occupation: string | null;
  location: string | null;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

interface FriendRequestWithProfile extends FriendRequest {
  requesterProfile?: Profile;
  receiverProfile?: Profile;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
}

interface FriendWithProfile extends Friendship {
  friendProfile?: Profile;
}

const Friends = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestWithProfile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(user.id);
    await Promise.all([
      loadFriends(user.id),
      loadPendingRequests(user.id),
      loadSuggestions(user.id)
    ]);
    setLoading(false);
  };

  const loadFriends = async (userId: string) => {
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading friends:", error);
      return;
    }

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      return;
    }

    // Fetch profiles for all friends
    const friendIds = friendships.map(f => f.friend_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, occupation, location")
      .in("id", friendIds);

    const friendsWithProfiles = friendships.map(friendship => ({
      ...friendship,
      friendProfile: profiles?.find(p => p.id === friendship.friend_id)
    }));

    setFriends(friendsWithProfiles);
  };

  const loadPendingRequests = async (userId: string) => {
    const { data: requests, error } = await supabase
      .from("friend_requests")
      .select("id, requester_id, receiver_id, status, created_at")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "pending");

    if (error) {
      console.error("Error loading pending requests:", error);
      return;
    }

    if (!requests || requests.length === 0) {
      setPendingRequests([]);
      return;
    }

    // Fetch profiles for all requesters and receivers
    const userIds = [...new Set([
      ...requests.map(r => r.requester_id),
      ...requests.map(r => r.receiver_id)
    ])];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, occupation, location")
      .in("id", userIds);

    const requestsWithProfiles = requests.map(request => ({
      ...request,
      requesterProfile: profiles?.find(p => p.id === request.requester_id),
      receiverProfile: profiles?.find(p => p.id === request.receiver_id)
    }));

    setPendingRequests(requestsWithProfiles);
  };

  const loadSuggestions = async (userId: string) => {
    // Get users who are not already friends and not in pending requests
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, occupation, location")
      .neq("id", userId)
      .limit(10);

    if (!allProfiles) return;

    // Get existing friend IDs
    const { data: existingFriends } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);

    // Get pending request IDs
    const { data: existingRequests } = await supabase
      .from("friend_requests")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("status", "pending");

    const friendIds = existingFriends?.map(f => f.friend_id) || [];
    const pendingIds = existingRequests?.map(r => 
      r.requester_id === userId ? r.receiver_id : r.requester_id
    ) || [];
    
    const filtered = allProfiles.filter(
      p => !friendIds.includes(p.id) && !pendingIds.includes(p.id)
    );

    setSuggestions(filtered.slice(0, 5));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, occupation, location")
      .neq("id", currentUserId)
      .ilike("full_name", `%${searchQuery}%`)
      .limit(20);

    if (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search users");
      return;
    }

    setSearchResults(data || []);
  };

  const sendFriendRequest = async (receiverId: string) => {
    const { error } = await supabase
      .from("friend_requests")
      .insert({
        requester_id: currentUserId,
        receiver_id: receiverId,
        status: "pending"
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("Friend request already sent");
      } else {
        toast.error("Failed to send friend request");
      }
      return;
    }

    toast.success("Friend request sent!");
    loadPendingRequests(currentUserId);
    loadSuggestions(currentUserId);
  };

  const acceptFriendRequest = async (requestId: string, _requesterId: string) => {
    // Use atomic edge function to accept friend request
    const { data, error } = await supabase.functions.invoke('accept-friend-request', {
      body: { requestId }
    });

    if (error || (data && data.error)) {
      console.error("Failed to accept request:", error || data?.error);
      toast.error("Failed to accept request");
      return;
    }

    toast.success("Friend request accepted!");
    loadFriends(currentUserId);
    loadPendingRequests(currentUserId);
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to reject request");
      return;
    }

    toast.success("Friend request rejected");
    loadPendingRequests(currentUserId);
  };

  const removeFriend = async (friendshipId: string, friendId: string) => {
    // Remove both directions of the friendship
    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(`id.eq.${friendshipId},and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

    if (error) {
      toast.error("Failed to remove friend");
      return;
    }

    toast.success("Friend removed");
    loadFriends(currentUserId);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-semibold">Add Friends, Share Styles</h1>
            <p className="text-sm text-muted-foreground">Connect with fashion enthusiasts</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {searchResults.length > 0 && (
            <Card className="mt-4">
              <CardContent className="p-4 space-y-3">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.occupation || "User"} • {user.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="pending">
              Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">People you may know</h2>
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No suggestions available
                </CardContent>
              </Card>
            ) : (
              suggestions.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.occupation || "User"} • {user.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pending friend requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => {
                const isReceived = request.receiver_id === currentUserId;
                const profile = isReceived ? request.requesterProfile : request.receiverProfile;
                
                return (
                  <Card key={request.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback>{getInitials(profile?.full_name || null)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile?.full_name || "Anonymous"}</p>
                          <p className="text-sm text-muted-foreground">
                            {profile?.occupation || "User"} • {profile?.location || "Unknown"}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {isReceived ? "Received" : "Sent"}
                          </Badge>
                        </div>
                      </div>
                      {isReceived ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptFriendRequest(request.id, request.requester_id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectFriendRequest(request.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectFriendRequest(request.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4 mt-4">
            <h2 className="text-lg font-semibold">My Friends</h2>
            {friends.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No friends yet</p>
                  <p className="text-sm mt-1">Start adding friends to share styles!</p>
                </CardContent>
              </Card>
            ) : (
              friends.map((friendship) => (
                <Card key={friendship.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friendship.friendProfile?.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(friendship.friendProfile?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {friendship.friendProfile?.full_name || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {friendship.friendProfile?.occupation || "User"} • {friendship.friendProfile?.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFriend(friendship.id, friendship.friend_id)}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
};

export default Friends;
