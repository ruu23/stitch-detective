import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { getDocument, getDocuments, addDocument, deleteDocument, invokeFunction } from "@/integrations/mongodb";
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
  fullName: string | null;
  avatarUrl: string | null;
  occupation: string | null;
  location: string | null;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: any;
}

interface FriendRequestWithProfile extends FriendRequest {
  requesterProfile?: Profile;
  receiverProfile?: Profile;
}

interface Friendship {
  id: string;
  userId: string;
  friendId: string;
}

interface FriendWithProfile extends Friendship {
  friendProfile?: Profile;
}

const Friends = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestWithProfile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/auth");
      return;
    }
    if (isLoaded && isSignedIn && user) {
      loadUserData();
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const loadUserData = async () => {
    if (!user) return;
    
    await Promise.all([
      loadFriends(user.id),
      loadPendingRequests(user.id),
      loadSuggestions(user.id)
    ]);
    setLoading(false);
  };

  const loadFriends = async (userId: string) => {
    try {
      const friendships = await getDocuments<Friendship>("friendships", { userId });

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      const friendsWithProfiles: FriendWithProfile[] = [];
      for (const friendship of friendships) {
        const profile = await getDocument<Profile>("profiles", friendship.friendId);
        friendsWithProfiles.push({
          ...friendship,
          friendProfile: profile ? { ...profile, id: friendship.friendId } : undefined
        });
      }

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const loadPendingRequests = async (userId: string) => {
    try {
      const sentRequests = await getDocuments<FriendRequest>("friendRequests", { requesterId: userId, status: "pending" });
      const receivedRequests = await getDocuments<FriendRequest>("friendRequests", { receiverId: userId, status: "pending" });

      const allRequests = [...(sentRequests || []), ...(receivedRequests || [])];

      if (allRequests.length === 0) {
        setPendingRequests([]);
        return;
      }

      const requestsWithProfiles: FriendRequestWithProfile[] = [];
      for (const request of allRequests) {
        const requesterProfile = await getDocument<Profile>("profiles", request.requesterId);
        const receiverProfile = await getDocument<Profile>("profiles", request.receiverId);
        requestsWithProfiles.push({
          ...request,
          requesterProfile: requesterProfile ? { ...requesterProfile, id: request.requesterId } : undefined,
          receiverProfile: receiverProfile ? { ...receiverProfile, id: request.receiverId } : undefined
        });
      }

      setPendingRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const loadSuggestions = async (userId: string) => {
    try {
      const allProfiles = await getDocuments<Profile>("profiles", { limit: 20 });

      const friendIds = friends.map(f => f.friendId);
      const pendingIds = pendingRequests.map(r => 
        r.requesterId === userId ? r.receiverId : r.requesterId
      );

      const filtered = (allProfiles || []).filter(
        p => p.id !== userId && !friendIds.includes(p.id) && !pendingIds.includes(p.id)
      );

      setSuggestions(filtered.slice(0, 5));
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }

    try {
      const allProfiles = await getDocuments<Profile>("profiles", { search: searchQuery });

      const filtered = (allProfiles || []).filter(
        p => p.id !== user.id && 
             p.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(filtered.slice(0, 20));
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search users");
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    
    try {
      await addDocument("friendRequests", {
        requesterId: user.id,
        receiverId: receiverId,
        status: "pending"
      });

      toast.success("Friend request sent!");
      loadPendingRequests(user.id);
      loadSuggestions(user.id);
    } catch (error) {
      toast.error("Failed to send friend request");
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      await invokeFunction("acceptFriendRequest", { requestId });

      toast.success("Friend request accepted!");
      loadFriends(user.id);
      loadPendingRequests(user.id);
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Failed to accept request");
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    if (!user) return;
    
    try {
      await deleteDocument("friendRequests", requestId);
      toast.success("Friend request rejected");
      loadPendingRequests(user.id);
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!user) return;
    
    try {
      await deleteDocument("friendships", friendshipId);
      toast.success("Friend removed");
      loadFriends(user.id);
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!isLoaded || loading) {
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
                {searchResults.map((searchUser) => (
                  <div key={searchUser.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={searchUser.avatarUrl || ""} />
                        <AvatarFallback>{getInitials(searchUser.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{searchUser.fullName || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">
                          {searchUser.occupation || "User"} • {searchUser.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(searchUser.id)}>
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
              suggestions.map((suggestionUser) => (
                <Card key={suggestionUser.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={suggestionUser.avatarUrl || ""} />
                        <AvatarFallback>{getInitials(suggestionUser.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{suggestionUser.fullName || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">
                          {suggestionUser.occupation || "User"} • {suggestionUser.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(suggestionUser.id)}>
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
                const isReceived = request.receiverId === user?.id;
                const profile = isReceived ? request.requesterProfile : request.receiverProfile;
                
                return (
                  <Card key={request.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile?.avatarUrl || ""} />
                          <AvatarFallback>{getInitials(profile?.fullName || null)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile?.fullName || "Anonymous"}</p>
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
                            onClick={() => acceptFriendRequest(request.id)}
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
                        <AvatarImage src={friendship.friendProfile?.avatarUrl || ""} />
                        <AvatarFallback>
                          {getInitials(friendship.friendProfile?.fullName || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {friendship.friendProfile?.fullName || "Anonymous"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {friendship.friendProfile?.occupation || "User"} • {friendship.friendProfile?.location || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFriend(friendship.id)}
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
