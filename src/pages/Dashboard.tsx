import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Sun, MapPin, Shirt, Calendar, ShoppingBag, Scan } from "lucide-react";

interface Profile {
  full_name: string;
  styling_preference: "veiled" | "unveiled";
  occupation: string;
  location: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileData) {
      navigate("/onboarding");
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-display font-semibold">
              Hello, {profile?.full_name?.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {profile?.location || "Add location"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sun className="h-4 w-4 text-orange-500" />
            <span>24°C • Sunny</span>
          </div>
        </div>

        {/* Today's Suggested Look */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Today's Suggested Look</h2>
            </div>
            <div className="aspect-[4/3] bg-muted rounded-lg mb-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Shirt className="h-16 w-16 mx-auto mb-2" />
                <p>Build your closet to get AI-styled outfits</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate("/outfit-recommendations")}>
              Get AI Outfit Suggestions
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/outfit-recommendations")}>
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">AI Stylist</p>
              <p className="text-xs text-muted-foreground">Get outfits</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/body-scan")}>
            <CardContent className="p-6 text-center">
              <Scan className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Body Scan</p>
              <p className="text-xs text-muted-foreground">Perfect fit</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/calendar")}>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Plan Outfits</p>
              <p className="text-xs text-muted-foreground">Schedule looks</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/shop")}>
            <CardContent className="p-6 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Shop</p>
              <p className="text-xs text-muted-foreground">Partner brands</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/closet")}>
            <CardContent className="p-6 text-center">
              <Shirt className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">My Closet</p>
              <p className="text-xs text-muted-foreground">View items</p>
            </CardContent>
          </Card>
        </div>

        {/* Brand Partners Preview */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Featured Partner Brands</h3>
            <div className="grid grid-cols-3 gap-3">
              {["Ascia", "Theyab", "Oudies"].map((brand) => (
                <div
                  key={brand}
                  className="aspect-square bg-muted rounded-lg flex items-center justify-center border border-border hover:border-primary transition-colors cursor-pointer"
                >
                  <span className="font-medium text-sm">{brand}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/shop")}>
              View All Brands
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;