import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-wardrobe.jpg";
import { Sparkles } from "lucide-react";

export const Hero = () => {
  return (
    <section className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
      
      <div className="container mx-auto px-6 pt-24 pb-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/20">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-accent font-medium text-sm">AI-Powered Styling</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
              Love Your Wardrobe,{" "}
              <span className="text-accent">Shop Less</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl font-light">
              Your personal AI stylist. Digitize your closet, discover endless outfit combinations, 
              and shop smarter—not harder.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="text-base px-8 h-12 bg-primary hover:bg-primary/90">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                Watch Demo
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-8 pt-12">
              <div className="space-y-1">
                <div className="text-3xl font-semibold">9M+</div>
                <div className="text-sm text-muted-foreground font-light">Users</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-semibold">50M+</div>
                <div className="text-sm text-muted-foreground font-light">Outfits</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-semibold">$2B+</div>
                <div className="text-sm text-muted-foreground font-light">Value Tracked</div>
              </div>
            </div>
          </div>
          
          <div className="relative lg:h-[650px] animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl blur-2xl" />
            <div className="relative h-full rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
              <img
                src={heroImage}
                alt="Organized wardrobe with AI-powered styling"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
