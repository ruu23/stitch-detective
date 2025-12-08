import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wand2, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Tag,
  DollarSign,
  Eye,
  Sparkles
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ClosetItem {
  id: string;
  name: string;
  category: string;
  item_type?: string;
  brand?: string;
  color_primary?: string;
  color_secondary?: string;
  pattern?: string;
  season?: string;
  image_url?: string;
  price_paid?: number;
  wear_count?: number;
  cost_per_wear?: number;
  ai_tags?: string[];
  style?: string;
  formality_level?: number;
  suitable_occasions?: string[];
  hijab_friendly?: boolean;
  modest_coverage?: string;
  notes?: string;
}

interface ItemDetailDialogProps {
  item: ClosetItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const ItemDetailDialog = ({ item, open, onOpenChange, onUpdate }: ItemDetailDialogProps) => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newTag, setNewTag] = useState("");
  const [allowInStyling, setAllowInStyling] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const seasons = item.season ? item.season.split(',').map(s => s.trim()) : [];
  const occasions = item.suitable_occasions || [];
  const tags = item.ai_tags || [];

  const handleSaveField = async (field: string, value: any) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("closet_items")
        .update({ [field]: value })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Updated!",
        description: "Item details saved successfully",
      });

      setEditMode(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const updatedTags = [...tags, newTag.trim()];
    await handleSaveField("ai_tags", updatedTags);
    setNewTag("");
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    await handleSaveField("ai_tags", updatedTags);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setLoading(true);

      // Delete image from storage if exists
      if (item.image_url) {
        const path = item.image_url.split('/').slice(-2).join('/');
        await supabase.storage.from("closet-items").remove([path]);
      }

      // Delete item from database
      const { error } = await supabase
        .from("closet_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Item removed from your closet",
      });

      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <Wand2 className="w-4 h-4 mr-2" />
              Prettify Photo
            </Button>
            <Button variant="outline" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Style This Item
            </Button>
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label>Brand</Label>
            {editMode === "brand" ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter brand name"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSaveField("brand", editValue)}
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditMode(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                onClick={() => {
                  setEditMode("brand");
                  setEditValue(item.brand || "");
                }}
              >
                <span className="text-sm">
                  {item.brand || "Add brand"}
                </span>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            {editMode === "name" ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter item name"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSaveField("name", editValue)}
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditMode(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                onClick={() => {
                  setEditMode("name");
                  setEditValue(item.name);
                }}
              >
                <span className="text-sm font-medium">{item.name}</span>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm capitalize">{item.category}</span>
            </div>
          </div>

          {/* Dress Codes / Occasions */}
          <div className="space-y-2">
            <Label>Dress Codes</Label>
            <div className="flex flex-wrap gap-2">
              {occasions.length > 0 ? (
                occasions.map((occasion, i) => (
                  <Badge key={i} variant="secondary" className="capitalize">
                    {occasion}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No occasions set</span>
              )}
            </div>
          </div>

          {/* Seasons */}
          <div className="space-y-2">
            <Label>Seasons</Label>
            <div className="flex flex-wrap gap-2">
              {seasons.length > 0 ? (
                seasons.map((season, i) => (
                  <Badge key={i} variant="outline" className="capitalize">
                    {season}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No seasons set</span>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <Label>Colors</Label>
            <div className="flex gap-2">
              {item.color_primary && (
                <Badge variant="secondary" className="capitalize">
                  {item.color_primary}
                </Badge>
              )}
              {item.color_secondary && (
                <Badge variant="outline" className="capitalize">
                  {item.color_secondary}
                </Badge>
              )}
            </div>
          </div>

          {/* Pattern */}
          {item.pattern && (
            <div className="space-y-2">
              <Label>Pattern</Label>
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm capitalize">{item.pattern}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim() || loading}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>Price</Label>
            {editMode === "price_paid" ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSaveField("price_paid", parseFloat(editValue) || null)}
                  disabled={loading}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditMode(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                onClick={() => {
                  setEditMode("price_paid");
                  setEditValue(item.price_paid?.toString() || "");
                }}
              >
                <span className="text-sm">
                  {item.price_paid ? `$${item.price_paid.toFixed(2)}` : "Unknown"}
                </span>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Allow in Styling */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <Label htmlFor="styling">Allow in styling</Label>
            <Switch
              id="styling"
              checked={allowInStyling}
              onCheckedChange={setAllowInStyling}
            />
          </div>

          {/* Stats */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>0 saved looks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Worn {item.wear_count || 0} times</span>
            </div>
            {item.cost_per_wear && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Cost per wear: ${item.cost_per_wear.toFixed(2)}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Saved outfits will appear here. We will keep track of this item's cost per wear
            </p>
          </div>

          {/* Delete Button */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
