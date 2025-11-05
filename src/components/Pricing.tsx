import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    features: [
      "Upload up to 50 wardrobe items",
      "3-day outfit planning",
      "Basic wardrobe analytics",
      "AI style analysis",
      "Color matching suggestions"
    ],
    cta: "Get Started Free",
    variant: "outline" as const
  },
  {
    name: "Premium",
    price: "9.99",
    description: "For the style-conscious",
    features: [
      "Unlimited wardrobe items",
      "Unlimited outfit planning",
      "Advanced analytics & insights",
      "Shopping recommendations",
      "Community styling access",
      "Packing list builder",
      "Digital avatar & fit prediction",
      "Priority support"
    ],
    cta: "Start Premium Trial",
    variant: "accent" as const,
    popular: true
  }
];

export const Pricing = () => {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join millions loving their wardrobes. No credit card needed to start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`p-8 space-y-6 relative shadow-soft hover:shadow-medium transition-all duration-300 ${
                plan.popular 
                  ? 'border-accent border-2 bg-gradient-subtle' 
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-medium shadow-accent">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                size="lg" 
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
