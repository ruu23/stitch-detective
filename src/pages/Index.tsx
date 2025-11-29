import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="h-8 w-8 text-accent" />
                <h1 className="text-3xl font-display font-semibold">StyleSync</h1>
              </div>
              
              <p className="text-muted-foreground mb-8">
                Your personal AI styling assistant
              </p>

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default Index;
