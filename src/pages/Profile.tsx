import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { getDocument } from "@/integrations/mongodb";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AvatarViewer } from "@/components/AvatarViewer";

interface Profile {
  fullName: string;
  stylingPreference: "veiled" | "unveiled";
  occupation: string;
  location: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      navigate("/auth");
      return;
    }

    loadProfile();
  }, [isLoaded, isSignedIn, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const data = await getDocument<Profile>("profiles", user.id);
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <User className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-display font-semibold mb-6">Profile</h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile?.fullName || user?.fullName}</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {profile?.stylingPreference} style
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {profile?.occupation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                  <p>{profile.occupation}</p>
                </div>
              )}
              {profile?.location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p>{profile.location}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AvatarViewer className="mb-6" />

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Profile;
