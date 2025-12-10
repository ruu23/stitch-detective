import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignIn, SignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display">StyleSync</CardTitle>
          <CardDescription>
            {activeTab === "signin" ? "Sign in to your account" : "Create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-input",
                    formButtonPrimary: "bg-primary hover:bg-primary/90",
                  }
                }}
                afterSignInUrl="/dashboard"
                redirectUrl="/dashboard"
              />
            </TabsContent>
            <TabsContent value="signup">
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border border-input",
                    formButtonPrimary: "bg-primary hover:bg-primary/90",
                  }
                }}
                afterSignUpUrl="/onboarding"
                redirectUrl="/onboarding"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
