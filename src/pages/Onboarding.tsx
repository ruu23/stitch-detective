import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shirt, Sparkles } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [stylingPreference, setStylingPreference] = useState<"veiled" | "unveiled" | null>(null);
  const [occupation, setOccupation] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.styling_preference) {
      navigate("/dashboard");
    }
  };

  const handleSaveProfile = async () => {
    if (!stylingPreference) {
      toast({
        title: "Please select a preference",
        description: "Choose either Veiled or Unveiled to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: user.user_metadata.full_name,
        styling_preference: stylingPreference,
        occupation,
        location,
      });

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Let's build your digital closet.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display">Welcome to StyleSync</CardTitle>
          <CardDescription>Let's personalize your styling experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Shirt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">How would you describe your style preference?</h3>
                <p className="text-muted-foreground">This helps us provide personalized outfit recommendations</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStylingPreference("veiled")}
                  className={`p-8 border-2 rounded-lg transition-all hover:border-primary ${
                    stylingPreference === "veiled"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🧕</div>
                    <h4 className="font-semibold mb-2">Veiled</h4>
                    <p className="text-sm text-muted-foreground">I wear hijab</p>
                  </div>
                </button>
                <button
                  onClick={() => setStylingPreference("unveiled")}
                  className={`p-8 border-2 rounded-lg transition-all hover:border-primary ${
                    stylingPreference === "unveiled"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">👗</div>
                    <h4 className="font-semibold mb-2">Unveiled</h4>
                    <p className="text-sm text-muted-foreground">I don't wear hijab</p>
                  </div>
                </button>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!stylingPreference}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Tell us more about yourself</h3>
                <p className="text-muted-foreground">Optional - helps us provide better recommendations</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g., Teacher, Designer, Student"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Cairo, Egypt"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSaveProfile} className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;