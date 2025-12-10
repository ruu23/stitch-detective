import { useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDocument, invokeFunction } from "@/integrations/mongodb";
import { uploadFile } from "@/integrations/cloudinary";
import { Camera, Upload, Crop, Loader2 } from "lucide-react";
import ReactCrop, { Crop as CropType } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import imageCompression from "browser-image-compression";

interface AddClosetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddClosetItemDialog = ({ open, onOpenChange, onSuccess }: AddClosetItemDialogProps) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [step, setStep] = useState<"select" | "crop" | "details" | "analyzing">("select");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [itemDetails, setItemDetails] = useState({ name: "", brand: "", price_paid: "", purchase_date: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleReset = () => {
    setStep("select");
    setSelectedImage(null);
    setAiAnalysis(null);
    setItemDetails({ name: "", brand: "", price_paid: "", purchase_date: "" });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const compressedFile = await imageCompression(file, { maxSizeMB: 4, maxWidthOrHeight: 2048, useWebWorker: true });
      const reader = new FileReader();
      reader.onload = (e) => { setSelectedImage(e.target?.result as string); setStep("crop"); setLoading(false); };
      reader.onerror = () => { toast({ title: "Error", description: "Failed to read image file", variant: "destructive" }); setLoading(false); };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
      setLoading(false);
    }
  };

  const getCroppedImage = useCallback(async (): Promise<Blob> => {
    if (!imageRef.current || !selectedImage) throw new Error("No image selected");
    const image = imageRef.current;
    if (!image.complete || image.naturalWidth === 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Image load timeout")), 10000);
        image.onload = () => { clearTimeout(timeout); resolve(); };
        if (image.complete && image.naturalWidth > 0) { clearTimeout(timeout); resolve(); }
      });
    }
    const scaleX = image.naturalWidth / 100;
    const scaleY = image.naturalHeight / 100;
    const cropX = crop.x * scaleX, cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX, cropHeight = crop.height * scaleY;
    const maxDimension = 1024;
    let finalWidth = cropWidth, finalHeight = cropHeight;
    if (cropWidth > maxDimension || cropHeight > maxDimension) {
      const scale = maxDimension / Math.max(cropWidth, cropHeight);
      finalWidth = Math.round(cropWidth * scale);
      finalHeight = Math.round(cropHeight * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, finalWidth, finalHeight);
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, finalWidth, finalHeight);
    return new Promise((resolve) => {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      const arr = dataUrl.split(',');
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      resolve(new Blob([u8arr], { type: "image/jpeg" }));
    });
  }, [crop, selectedImage]);

  const handleCropComplete = async () => {
    try {
      setLoading(true);
      setStep("analyzing");
      const croppedBlob = await getCroppedImage();
      const compressedFile = await imageCompression(croppedBlob as File, { maxSizeMB: 0.8, maxWidthOrHeight: 1024, useWebWorker: true, fileType: "image/jpeg" });
      
      if (!user) throw new Error("User not authenticated");
      
      // Upload to Cloudinary
      const publicUrl = await uploadFile(compressedFile, `closet-items/${user.id}`);
      
      console.log("Image uploaded, calling AI analysis...");
      
      // Use API for AI analysis
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Function timeout")), 30000)
      );
      
      const analysisPromise = invokeFunction<{ imageUrl: string }, { analysis: any }>(
        'analyzeClosetItem', 
        { imageUrl: publicUrl }
      );
      
      const analysisData = await Promise.race([analysisPromise, timeoutPromise]) as { analysis: any };
      
      if (!analysisData?.analysis) {
        throw new Error("No analysis data received");
      }
      
      console.log("Analysis complete:", analysisData);
      
      setAiAnalysis({ ...analysisData.analysis, imageUrl: publicUrl });
      setItemDetails({ name: analysisData.analysis.name || "", brand: analysisData.analysis.brand || "", price_paid: "", purchase_date: new Date().toISOString().split("T")[0] });
      setStep("details");
      toast({ title: "Analysis complete!", description: "Review the details and save your item" });
    } catch (error: any) {
      console.error("Crop complete error:", error);
      toast({ title: "Error", description: error.message || "Failed to analyze item", variant: "destructive" });
      handleReset();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error("User not authenticated");
      await addDocument("closetItems", {
        userId: user.id,
        name: itemDetails.name,
        brand: itemDetails.brand || aiAnalysis.brand || null,
        pricePaid: itemDetails.price_paid ? parseFloat(itemDetails.price_paid) : null,
        purchaseDate: itemDetails.purchase_date || null,
        imageUrl: aiAnalysis.imageUrl,
        itemType: aiAnalysis.item_type,
        category: aiAnalysis.category,
        colorPrimary: aiAnalysis.color_primary,
        colorSecondary: aiAnalysis.color_secondary || null,
        pattern: aiAnalysis.pattern,
        season: Array.isArray(aiAnalysis.season) ? aiAnalysis.season.join(',') : aiAnalysis.season,
        style: aiAnalysis.style || null,
        suitableOccasions: aiAnalysis.suitable_occasions || [],
        formalityLevel: aiAnalysis.formality_level || null,
        hijabFriendly: aiAnalysis.hijab_friendly || false,
        modestCoverage: aiAnalysis.modest_coverage || null,
        aiTags: aiAnalysis.tags || [],
        wearCount: 0
      });
      toast({ title: "Success!", description: "Item added to your closet" });
      handleReset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item to Closet</DialogTitle>
          <DialogDescription>
            {step === "select" && "Choose how to capture your item"}
            {step === "crop" && "Adjust the crop to focus on your item"}
            {step === "analyzing" && "Analyzing your item with AI..."}
            {step === "details" && "Review and edit item details"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="grid grid-cols-2 gap-4 py-8">
            <Button variant="outline" className="h-32 flex flex-col gap-2" onClick={() => cameraInputRef.current?.click()} disabled={loading}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
              <span>{loading ? "Processing..." : "Take Photo"}</span>
            </Button>
            <Button variant="outline" className="h-32 flex flex-col gap-2" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
              <span>{loading ? "Processing..." : "Upload Image"}</span>
            </Button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }} />
          </div>
        )}

        {step === "crop" && selectedImage && (
          <div className="space-y-4">
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
              <img ref={imageRef} src={selectedImage} alt="Crop preview" className="max-h-96 w-full object-contain" crossOrigin="anonymous" />
            </ReactCrop>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1" disabled={loading}>Cancel</Button>
              <Button onClick={handleCropComplete} className="flex-1" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><Crop className="mr-2 h-4 w-4" />Continue</>}
              </Button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg">Analyzing your item...</p>
          </div>
        )}

        {step === "details" && aiAnalysis && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <img src={aiAnalysis.imageUrl} alt="Item" className="w-32 h-32 object-cover rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.tags?.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div><Label htmlFor="name">Item Name *</Label><Input id="name" value={itemDetails.name} onChange={(e) => setItemDetails({ ...itemDetails, name: e.target.value })} /></div>
              <div><Label htmlFor="brand">Brand</Label><Input id="brand" value={itemDetails.brand} onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="price">Price Paid</Label><Input id="price" type="number" value={itemDetails.price_paid} onChange={(e) => setItemDetails({ ...itemDetails, price_paid: e.target.value })} /></div>
                <div><Label htmlFor="date">Purchase Date</Label><Input id="date" type="date" value={itemDetails.purchase_date} onChange={(e) => setItemDetails({ ...itemDetails, purchase_date: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleReset} className="flex-1" disabled={loading}>Cancel</Button>
              <Button onClick={handleSaveItem} className="flex-1" disabled={loading || !itemDetails.name}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save to Closet"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
