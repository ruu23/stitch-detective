import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Palette 
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Style Analysis",
    description: "Automatically detect body shape, skin tone, and personal style preferences from your photos"
  },
  {
    icon: Palette,
    title: "Smart Color Matching",
    description: "Get personalized color recommendations based on your skin tone and seasonal palettes"
  },
  {
    icon: TrendingUp,
    title: "Outfit Suggestions",
    description: "AI-powered outfit planning with explanations of why each combination works"
  },
  {
    icon: BarChart3,
    title: "Wardrobe Analytics",
    description: "Track usage, value, and discover gaps in your wardrobe to shop intentionally"
  },
  {
    icon: ShoppingBag,
    title: "Smart Shopping",
    description: "Connect to local and international retailers for personalized recommendations"
  },
  {
    icon: Users,
    title: "Community Styling",
    description: "Share looks and get styling ideas from a community of fashion enthusiasts"
  }
];

export const Features = () => {
  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-warm">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Everything You Need to Master Your Style
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powered by AI to help you make confident style choices every day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 space-y-4 shadow-soft hover:shadow-medium transition-all duration-300 border-border bg-card/80 backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
