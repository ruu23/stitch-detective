import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const brands = [
  { name: "Ascia", type: "local" },
  { name: "Theyab", type: "local" },
  { name: "Oudies", type: "local" },
  { name: "Zara", type: "international" },
  { name: "H&M", type: "international" },
  { name: "Mango", type: "international" },
];

const Shop = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-display font-semibold mb-2">Partner Brands</h1>
        <p className="text-muted-foreground mb-6">Shop complete looks from our partners</p>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Local Brands</h2>
            <div className="grid gap-4">
              {brands
                .filter((b) => b.type === "local")
                .map((brand) => (
                  <Card key={brand.name} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">{brand.name}</h3>
                        <Badge variant="secondary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Partner
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="aspect-square bg-muted rounded-lg"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">International Brands</h2>
            <div className="grid gap-4">
              {brands
                .filter((b) => b.type === "international")
                .map((brand) => (
                  <Card key={brand.name} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">{brand.name}</h3>
                        <Badge variant="outline">International</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="aspect-square bg-muted rounded-lg"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Shop;