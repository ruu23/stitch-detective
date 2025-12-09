import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, getDocument, getDocuments, where, orderBy } from "@/integrations/firebase";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Shirt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddClosetItemDialog } from "@/components/AddClosetItemDialog";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";

interface ClosetItem {
  id: string;
  name: string;
  category: string;
  itemType?: string;
  brand?: string;
  color?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  pattern?: string;
  season?: string;
  imageUrl?: string;
  pricePaid?: number;
  wearCount?: number;
  costPerWear?: number;
  aiTags?: string[];
  style?: string;
  formalityLevel?: number;
  suitableOccasions?: string[];
  hijabFriendly?: boolean;
  modestCoverage?: string;
  notes?: string;
}

const Closet = () => {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClosetItems();
  }, []);

  const loadClosetItems = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const profile = await getDocument("profiles", user.uid);

    if (!profile) {
      navigate("/onboarding");
      return;
    }

    try {
      const data = await getDocuments<ClosetItem>(
        "closetItems",
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      setItems(data || []);
    } catch (error) {
      toast({
        title: "Error loading closet",
        description: (error as Error).message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleItemClick = (item: ClosetItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-semibold">My Closet</h1>
              <p className="text-sm text-muted-foreground">{items.length} items</p>
            </div>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="w-full bg-foreground text-background py-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all"
            size="lg"
          >
            <Camera className="w-5 h-5" />
            Add Item to Closet
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
                <Camera className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
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

      <ItemDetailDialog
        item={selectedItem}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={loadClosetItems}
      />
    </div>
  );
};

export default Closet;
