import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowLeft, Loader2, Check } from "lucide-react";

const OutfitRecommendations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [wearingOutfit, setWearingOutfit] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!occasion) {
      toast({
        title: "Occasion required",
        description: "Please enter an occasion for outfit recommendations",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-outfit-recommendations",
        {
          body: {
            occasion,
            date: date || new Date().toISOString().split('T')[0],
          },
        }
      );

      if (error) throw error;

      if (data.error) {
        toast({
          title: "No recommendations",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setRecommendations(data);
      toast({
        title: "Success!",
        description: `Generated ${data.recommendations.length} outfit suggestions`,
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWearOutfit = async (outfitIndex: number, items: any[]) => {
    setWearingOutfit(outfitIndex);
    try {
      const itemIds = items.map(item => item.id);
      
      const { data, error } = await supabase.functions.invoke(
        "update-wear-count",
        {
          body: { itemIds },
        }
      );

      if (error) throw error;

      toast({
        title: "Outfit logged!",
        description: `Updated wear count and cost-per-wear for ${itemIds.length} items`,
      });
    } catch (error) {
      console.error("Error updating wear count:", error);
      toast({
        title: "Error",
        description: "Failed to update wear count",
        variant: "destructive",
      });
    } finally {
      setWearingOutfit(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Outfit Recommendations</h1>
            <p className="text-muted-foreground">AI-powered styling based on your closet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                placeholder="e.g., Wedding, Office, Casual brunch"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date (Optional)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Outfits
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {recommendations && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">
                {recommendations.recommendations.length} Outfit{recommendations.recommendations.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-sm text-muted-foreground">
                From {recommendations.filtered_items_count} suitable items
              </p>
            </div>

            {recommendations.recommendations.map((outfit: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{outfit.outfit_name}</span>
                    {!outfit.is_complete && (
                      <span className="text-sm font-normal text-muted-foreground">
                        Missing pieces
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {outfit.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Why this works:</span>{" "}
                      {outfit.reasoning}
                    </p>

                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="font-medium">Color Harmony:</span>{" "}
                        {(outfit.color_harmony_score * 100).toFixed(0)}%
                      </div>
                      <div>
                        <span className="font-medium">Style Cohesion:</span>{" "}
                        {(outfit.style_cohesion_score * 100).toFixed(0)}%
                      </div>
                      <div>
                        <span className="font-medium">Occasion Fit:</span>{" "}
                        {(outfit.occasion_fit_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {outfit.styling_tips.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Styling Tips:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {outfit.styling_tips.map((tip: string, i: number) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {outfit.missing_pieces && outfit.missing_pieces.length > 0 && (
                    <div className="bg-muted rounded-lg p-3 space-y-2">
                      <p className="font-medium text-sm">Missing Pieces:</p>
                      <p className="text-sm text-muted-foreground">
                        {outfit.missing_pieces.join(", ")}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => handleWearOutfit(index, outfit.items)}
                    disabled={wearingOutfit === index}
                    className="w-full"
                    size="lg"
                  >
                    {wearingOutfit === index ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Wear This Outfit
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitRecommendations;
