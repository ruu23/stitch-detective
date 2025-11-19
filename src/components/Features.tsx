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
    description: "Upload your photo and we'll detect your body shape, skin tone, hair color — and personalize everything for you"
  },
  {
    icon: Palette,
    title: "Auto-Tag Everything",
    description: "AI automatically crops and tags your clothes by color, category, and style. No manual work required"
  },
  {
    icon: TrendingUp,
    title: "Daily Outfit Planner",
    description: "Get outfit suggestions with AI explanations — discover new combinations you never thought of"
  },
  {
    icon: BarChart3,
    title: "Wardrobe Insights",
    description: "See what you actually wear, track item value, and find the gaps (like missing neutrals)"
  },
  {
    icon: ShoppingBag,
    title: "Shop Intentionally",
    description: "Only buy what you need. Connect to local and global retailers for smart, personalized recommendations"
  },
  {
    icon: Users,
    title: "Style Community",
    description: "Share your looks, get inspiration from others, and discover your personal style together"
  }
];

export const Features = () => {
  return (
    <section id="features" className="container mx-auto px-4 py-20 bg-secondary/30">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            See What You Own. Wear What You Love.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered features that help you rediscover your wardrobe and build confidence in your style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-border animate-fade-in"
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
