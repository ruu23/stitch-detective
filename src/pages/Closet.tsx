import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Shirt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddClosetItemDialog } from "@/components/AddClosetItemDialog";

interface ClosetItem {
  id: string;
  name: string;
  category: string;
  item_type?: string;
  brand?: string;
  color?: string;
  color_primary?: string;
  color_secondary?: string;
  pattern?: string;
  season?: string;
  image_url?: string;
  price_paid?: number;
  wear_count?: number;
  cost_per_wear?: number;
  ai_tags?: string[];
}

const Closet = () => {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClosetItems();
  }, []);

  const loadClosetItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      navigate("/onboarding");
      return;
    }

    const { data, error } = await supabase
      .from("closet_items")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading closet",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Shirt className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold">My Closet</h1>
            <p className="text-sm text-muted-foreground">{items.length} items</p>
          </div>
          <Button size="icon" onClick={() => setDialogOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shirt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Your closet is empty</h3>
              <p className="text-muted-foreground mb-6">
                Start adding your clothing items to get personalized outfit suggestions
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Shirt className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  {item.brand && (
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
      
      <AddClosetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadClosetItems}
      />
    </div>
  );
};

export default Closet;