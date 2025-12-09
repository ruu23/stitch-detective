import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateDocument, deleteDocument, deleteFile, getPathFromUrl } from "@/integrations/firebase";
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
  itemType?: string;
  brand?: string;
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
  const occasions = item.suitableOccasions || [];
  const tags = item.aiTags || [];

  const handleSaveField = async (field: string, value: any) => {
    try {
      setLoading(true);
      await updateDocument("closetItems", item.id, { [field]: value });

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
    await handleSaveField("aiTags", updatedTags);
    setNewTag("");
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    await handleSaveField("aiTags", updatedTags);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setLoading(true);

      if (item.imageUrl) {
        const path = getPathFromUrl(item.imageUrl);
        if (path) {
          await deleteFile(path).catch(console.error);
        }
      }

      await deleteDocument("closetItems", item.id);

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
          <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

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

          <div className="space-y-2">
            <Label>Brand</Label>
            {editMode === "brand" ? (
              <div className="flex gap-2">
                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Enter brand name" autoFocus />
                <Button size="icon" variant="ghost" onClick={() => handleSaveField("brand", editValue)} disabled={loading}><Check className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditMode(null)}><X className="w-4 h-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80" onClick={() => { setEditMode("brand"); setEditValue(item.brand || ""); }}>
                <span className="text-sm">{item.brand || "Add brand"}</span>
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm capitalize">{item.category}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleRemoveTag(tag)}>
                  {tag}<X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag" onKeyDown={(e) => e.key === "Enter" && handleAddTag()} />
              <Button onClick={handleAddTag} disabled={!newTag.trim() || loading}><Tag className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <Label htmlFor="styling">Allow in styling</Label>
            <Switch id="styling" checked={allowInStyling} onCheckedChange={setAllowInStyling} />
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" /><span>0 saved looks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" /><span>Worn {item.wearCount || 0} times</span>
            </div>
            {item.costPerWear && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" /><span>Cost per wear: ${item.costPerWear.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Button variant="destructive" className="w-full" onClick={handleDelete} disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" />Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
