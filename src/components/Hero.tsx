import { Button } from "@/components/ui/button";
import { Sparkles, Upload, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-wardrobe.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Organized wardrobe with elegant clothing"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      </div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Fashion Assistant
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Love Your Wardrobe,
            <span className="block bg-gradient-accent bg-clip-text text-transparent mt-2">
              Shop Less, Style More
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your personal AI fashion assistant. Digitize your closet, discover your unique style, 
            and never wonder "what to wear" again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" variant="accent" className="text-lg px-8">
              <Upload className="w-5 h-5" />
              Start Building Your Wardrobe
            </Button>
            <Button size="lg" variant="hero" className="text-lg px-8">
              <TrendingUp className="w-5 h-5" />
              See How It Works
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-soft border border-border hover:shadow-medium transition-all">
              <div className="text-3xl font-bold text-primary mb-2">9M+</div>
              <p className="text-sm text-muted-foreground">Users loving their wardrobes</p>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-soft border border-border hover:shadow-medium transition-all">
              <div className="text-3xl font-bold text-accent mb-2">Buy Less</div>
              <p className="text-sm text-muted-foreground">Stop impulse shopping, use what you own</p>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-soft border border-border hover:shadow-medium transition-all">
              <div className="text-3xl font-bold text-primary mb-2">AI Powered</div>
              <p className="text-sm text-muted-foreground">Instant style analysis & recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
