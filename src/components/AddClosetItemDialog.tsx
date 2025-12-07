import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [step, setStep] = useState<"select" | "crop" | "details" | "analyzing">("select");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [itemDetails, setItemDetails] = useState({
    name: "",
    brand: "",
    price_paid: "",
    purchase_date: "",
  });
  
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
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Compress image early for better preview performance
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 4, // Allow larger size for better quality during cropping
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      });
      
      console.log(`Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      // Create preview from compressed file
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setStep("crop");
        setLoading(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setLoading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: "Error",
        description: "Failed to process image. Try a smaller file.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getCroppedImage = useCallback(async (): Promise<Blob> => {
    if (!imageRef.current || !selectedImage) {
      throw new Error("No image selected");
    }

    const image = imageRef.current;
    
    // Wait for image to be fully loaded with timeout
    if (!image.complete || image.naturalWidth === 0) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Image load timeout"));
        }, 10000);
        
        image.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        image.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Image failed to load"));
        };
        
        // If already loaded
        if (image.complete && image.naturalWidth > 0) {
          clearTimeout(timeout);
          resolve();
        }
      });
    }

    // Calculate crop dimensions in pixels
    const scaleX = image.naturalWidth / 100;
    const scaleY = image.naturalHeight / 100;
    
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    // Validate dimensions
    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error("Invalid crop dimensions");
    }

    // Create canvas with size limit for mobile (1280px max)
    const maxDimension = 1280;
    let finalWidth = cropWidth;
    let finalHeight = cropHeight;
    
    if (cropWidth > maxDimension || cropHeight > maxDimension) {
      const scale = maxDimension / Math.max(cropWidth, cropHeight);
      finalWidth = Math.round(cropWidth * scale);
      finalHeight = Math.round(cropHeight * scale);
    }

    console.log(`Canvas size: ${finalWidth}x${finalHeight} (original crop: ${cropWidth}x${cropHeight})`);

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: false,
      desynchronized: true // Better performance on mobile
    });

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Fill white background (important for JPEG)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Draw cropped image
    try {
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );
    } catch (drawError) {
      console.error("Canvas draw error:", drawError);
      throw new Error("Failed to draw image on canvas");
    }

    // Convert to blob with multiple fallback strategies
    return new Promise((resolve, reject) => {
      // Strategy 1: Try standard toBlob (quality 0.8)
      try {
        canvas.toBlob(
          async (blob) => {
            if (blob && blob.size > 0) {
              console.log(`Blob created successfully: ${(blob.size / 1024).toFixed(2)}KB`);
              resolve(blob);
            } else {
              // Strategy 2: Try with lower quality
              console.log("First attempt failed, trying lower quality...");
              canvas.toBlob(
                (blob2) => {
                  if (blob2 && blob2.size > 0) {
                    console.log(`Blob created with lower quality: ${(blob2.size / 1024).toFixed(2)}KB`);
                    resolve(blob2);
                  } else {
                    // Strategy 3: Use dataURL as fallback
                    console.log("toBlob failed, using dataURL fallback...");
                    try {
                      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                      const arr = dataUrl.split(',');
                      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
                      const bstr = atob(arr[1]);
                      let n = bstr.length;
                      const u8arr = new Uint8Array(n);
                      while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                      }
                      const fallbackBlob = new Blob([u8arr], { type: mime });
                      console.log(`Fallback blob created: ${(fallbackBlob.size / 1024).toFixed(2)}KB`);
                      resolve(fallbackBlob);
                    } catch (fallbackError) {
                      console.error("All strategies failed:", fallbackError);
                      reject(new Error("Failed to create image blob. Try taking a new photo."));
                    }
                  }
                },
                "image/jpeg",
                0.7
              );
            }
          },
          "image/jpeg",
          0.8
        );
      } catch (error) {
        console.error("toBlob error:", error);
        reject(new Error("Canvas conversion failed. Try a smaller crop area."));
      }

      // Timeout fallback
      setTimeout(() => {
        reject(new Error("Image processing timeout. Please try again."));
      }, 15000);
    });
  }, [crop, selectedImage]);

  const handleCropComplete = async () => {
    try {
      setLoading(true);
      setStep("analyzing");

      console.log("Starting crop process...");

      // Get cropped image with mobile optimizations
      const croppedBlob = await getCroppedImage();
      console.log(`Cropped blob size: ${(croppedBlob.size / 1024 / 1024).toFixed(2)}MB`);

      // Compress image more aggressively for mobile (max 1MB)
      const compressedFile = await imageCompression(croppedBlob as File, {
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.8,
      });

      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

      // Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileName = `${user.id}/${Date.now()}.jpg`;
      
      console.log("Uploading to Supabase...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("closet-items")
        .upload(fileName, compressedFile, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData.path);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("closet-items")
        .getPublicUrl(uploadData.path);

      console.log("Public URL:", publicUrl);

      // Send to AI Analysis
      console.log("Starting AI analysis...");
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-closet-item",
        {
          body: { imageUrl: publicUrl },
        }
      );

      console.log("Analysis response:", analysisData);

      if (analysisError) {
        console.error("Analysis error:", analysisError);
        throw new Error(analysisError.message || "AI analysis failed");
      }

      if (!analysisData?.analysis) {
        console.error("Invalid analysis data:", analysisData);
        throw new Error(analysisData?.error || "No analysis data received");
      }

      setAiAnalysis({
        ...analysisData.analysis,
        imageUrl: publicUrl,
      });

      // Pre-fill form with AI data
      setItemDetails({
        name: analysisData.analysis.name || "",
        brand: analysisData.analysis.brand || "",
        price_paid: "",
        purchase_date: new Date().toISOString().split("T")[0],
      });

      setStep("details");
      toast({
        title: "Analysis complete!",
        description: "Review the details and save your item",
      });
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process image";
      
      // More user-friendly error messages
      let displayMessage = errorMessage;
      if (errorMessage.includes("blob") || errorMessage.includes("canvas")) {
        displayMessage = "Image processing failed. Please try:\n• Taking a new photo\n• Using a smaller crop area\n• Ensuring good lighting";
      } else if (errorMessage.includes("timeout")) {
        displayMessage = "Processing took too long. Please try again with better lighting.";
      } else if (errorMessage.includes("Rate limit")) {
        displayMessage = "Too many requests. Please wait a moment and try again.";
      } else if (errorMessage.includes("credits")) {
        displayMessage = "AI credits exhausted. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: displayMessage,
        variant: "destructive",
      });
      handleReset();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("closet_items").insert({
        user_id: user.id,
        name: itemDetails.name,
        brand: itemDetails.brand || aiAnalysis.brand || null,
        price_paid: itemDetails.price_paid ? parseFloat(itemDetails.price_paid) : null,
        purchase_date: itemDetails.purchase_date || null,
        image_url: aiAnalysis.imageUrl,
        item_type: aiAnalysis.item_type,
        category: aiAnalysis.category,
        color_primary: aiAnalysis.color_primary,
        color_secondary: aiAnalysis.color_secondary || null,
        pattern: aiAnalysis.pattern,
        season: Array.isArray(aiAnalysis.season) ? aiAnalysis.season.join(',') : aiAnalysis.season,
        style: aiAnalysis.style || null,
        suitable_occasions: aiAnalysis.suitable_occasions || [],
        formality_level: aiAnalysis.formality_level || null,
        hijab_friendly: aiAnalysis.hijab_friendly || false,
        modest_coverage: aiAnalysis.modest_coverage || null,
        ai_tags: aiAnalysis.tags || [],
        notes: null,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Item added to your closet",
      });

      handleReset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={handleCameraClick}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
              <span>{loading ? "Processing..." : "Take Photo"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={handleUploadClick}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Upload className="h-8 w-8" />
              )}
              <span>{loading ? "Processing..." : "Upload Image"}</span>
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
                e.target.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
                e.target.value = '';
              }}
            />
          </div>
        )}

        {step === "crop" && selectedImage && (
          <div className="space-y-4">
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} aspect={undefined}>
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Crop preview"
                className="max-h-96 w-full object-contain"
                crossOrigin="anonymous"
                onLoad={() => console.log("Image loaded for cropping")}
                onError={(e) => console.error("Image load error:", e)}
              />
            </ReactCrop>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCropComplete} className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crop className="mr-2 h-4 w-4" />
                    Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg">Analyzing your item...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {step === "details" && aiAnalysis && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <img
                src={aiAnalysis.imageUrl}
                alt="Item"
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.tags?.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold">{aiAnalysis.style}</span>
                  <span>•</span>
                  <span>Formality: {aiAnalysis.formality_level}/5</span>
                  {aiAnalysis.hijab_friendly && (
                    <>
                      <span>•</span>
                      <span className="text-primary">✓ Hijab Friendly</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Coverage: {aiAnalysis.modest_coverage} | Seasons: {Array.isArray(aiAnalysis.season) ? aiAnalysis.season.join(', ') : aiAnalysis.season}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={itemDetails.name}
                  onChange={(e) => setItemDetails({ ...itemDetails, name: e.target.value })}
                  placeholder="e.g., Black Blazer"
                />
              </div>

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={itemDetails.brand}
                  onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })}
                  placeholder="e.g., Zara"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">Price Paid</Label>
                  <Input
                    id="price"
                    type="number"
                    value={itemDetails.price_paid}
                    onChange={(e) => setItemDetails({ ...itemDetails, price_paid: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={itemDetails.purchase_date}
                    onChange={(e) => setItemDetails({ ...itemDetails, purchase_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleReset} className="flex-1" disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveItem}
                className="flex-1"
                disabled={loading || !itemDetails.name}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save to Closet"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
