import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addDocument, invokeFunction } from "@/integrations/mongodb";
import { uploadFile } from "@/integrations/cloudinary";

type ScanStep = "intro" | "front" | "side" | "face" | "measurements" | "avatar-processing" | "processing" | "complete";

const BodyScan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const [step, setStep] = useState<ScanStep>("intro");
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [height, setHeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const handlePhotoCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "side" | "face"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === "front") {
        setFrontPhoto(result);
        setStep("side");
      } else if (type === "side") {
        setSidePhoto(result);
        setStep("face");
      } else {
        setFacePhoto(result);
        setStep("measurements");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveScan = async (frontUrl: string, sideUrl: string, faceUrl: string, useAI: boolean = false, generateAvatar: boolean = false) => {
    try {
      if (generateAvatar) {
        setStep("avatar-processing");
      } else {
        setStep("processing");
      }

      if (!user) throw new Error("User not authenticated");

      let aiAnalysis = null;

      // Convert base64 to blob and upload to Cloudinary
      const frontBlob = await fetch(frontUrl).then(r => r.blob());
      const sideBlob = await fetch(sideUrl).then(r => r.blob());
      const faceBlob = await fetch(faceUrl).then(r => r.blob());

      const [frontPublicUrl, sidePublicUrl, facePublicUrl] = await Promise.all([
        uploadFile(frontBlob, `body-scans/${user.id}`),
        uploadFile(sideBlob, `body-scans/${user.id}`),
        uploadFile(faceBlob, `body-scans/${user.id}`),
      ]);

      // Get AI analysis if requested
      if (useAI) {
        toast({
          title: "Analyzing body shape...",
          description: "This may take a moment",
        });

        try {
          const analysisData = await invokeFunction("analyzeBodyShape", {
            frontImageUrl: frontPublicUrl,
            sideImageUrl: sidePublicUrl,
          });

          if (analysisData) {
            aiAnalysis = analysisData;
            if ((analysisData as any).estimated_measurements) {
              setHeight(String((analysisData as any).estimated_measurements.height || ""));
              setBust(String((analysisData as any).estimated_measurements.bust || ""));
              setWaist(String((analysisData as any).estimated_measurements.waist || ""));
              setHips(String((analysisData as any).estimated_measurements.hips || ""));
            }
          }
        } catch (analysisError) {
          console.error("AI analysis error:", analysisError);
          toast({
            title: "AI Analysis Failed",
            description: "Using manual measurements instead",
            variant: "destructive",
          });
        }
      }

      // Save to database
      const bodyScanData = await addDocument("bodyScans", {
        userId: user.id,
        frontImageUrl: frontPublicUrl,
        sideImageUrl: sidePublicUrl,
        faceImageUrl: facePublicUrl,
        height: height ? parseFloat(height) : ((aiAnalysis as any)?.estimated_measurements?.height || null),
        bust: bust ? parseFloat(bust) : ((aiAnalysis as any)?.estimated_measurements?.bust || null),
        waist: waist ? parseFloat(waist) : ((aiAnalysis as any)?.estimated_measurements?.waist || null),
        hips: hips ? parseFloat(hips) : ((aiAnalysis as any)?.estimated_measurements?.hips || null),
        bodyShape: (aiAnalysis as any)?.body_shape || null,
        measurementsJson: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
      });

      // Generate 3D Avatar if requested
      if (generateAvatar && bodyScanData) {
        toast({
          title: "Generating 3D Avatar...",
          description: "Creating your hyper-realistic avatar",
        });

        try {
          const avatarData = await invokeFunction("generateAvatar", {
            frontImageUrl: frontPublicUrl,
            sideImageUrl: sidePublicUrl,
            faceImageUrl: facePublicUrl,
          });

          if ((avatarData as any)?.success) {
            toast({
              title: "Avatar Generated!",
              description: "Your 3D avatar is ready",
            });
          }
        } catch (avatarError) {
          console.error("Avatar generation error:", avatarError);
          toast({
            title: "Avatar Generation Failed",
            description: "Body scan saved, but avatar creation encountered an error",
            variant: "destructive",
          });
        }
      }

      setStep("complete");
      
      toast({
        title: "Success!",
        description: "Body scan saved successfully",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error saving body scan:", error);
      toast({
        title: "Error",
        description: "Failed to save body scan",
        variant: "destructive",
      });
      setStep("intro");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === "intro" && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div>
                <h1 className="text-3xl font-display font-bold mb-2">
                  Let's find your perfect fit
                </h1>
                <p className="text-muted-foreground">
                  Take 3 quick photos to get personalized styling
                </p>
              </div>

              <div className="bg-muted rounded-xl p-8 space-y-6">
                <div className="flex justify-center gap-4">
                  <div className="text-center space-y-2">
                    <div className="w-20 h-28 bg-background rounded-lg flex items-center justify-center mx-auto">
                      <div className="text-3xl">🧍</div>
                    </div>
                    <p className="text-xs font-medium">Front</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-20 h-28 bg-background rounded-lg flex items-center justify-center mx-auto">
                      <div className="text-3xl">🚶</div>
                    </div>
                    <p className="text-xs font-medium">Side</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-20 h-28 bg-background rounded-lg flex items-center justify-center mx-auto">
                      <div className="text-3xl">😊</div>
                    </div>
                    <p className="text-xs font-medium">Face</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={() => setStep("front")}>
                <Camera className="mr-2 h-5 w-5" />
                Start Body Scan
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "front" && (
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">Front Photo</h2>
                <p className="text-muted-foreground">Stand straight facing the camera</p>
              </div>

              <div className="bg-muted rounded-xl p-12 flex items-center justify-center">
                <div className="text-6xl">🧍</div>
              </div>

              <div className="space-y-3">
                <label htmlFor="front-photo">
                  <Button size="lg" className="w-full" asChild>
                    <span>
                      <Camera className="mr-2 h-5 w-5" />
                      Take Front Photo
                    </span>
                  </Button>
                </label>
                <input
                  id="front-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoCapture(e, "front")}
                />
                <Button variant="outline" className="w-full" onClick={() => setStep("intro")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "side" && (
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">Side Photo</h2>
                <p className="text-muted-foreground">Turn to your side, keep the same posture</p>
              </div>

              <div className="bg-muted rounded-xl p-12 flex items-center justify-center">
                <div className="text-6xl">🚶</div>
              </div>

              <div className="space-y-3">
                <label htmlFor="side-photo">
                  <Button size="lg" className="w-full" asChild>
                    <span>
                      <Camera className="mr-2 h-5 w-5" />
                      Take Side Photo
                    </span>
                  </Button>
                </label>
                <input
                  id="side-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoCapture(e, "side")}
                />
                <Button variant="outline" className="w-full" onClick={() => setStep("front")}>
                  Retake Front Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "face" && (
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">Face Close-Up</h2>
                <p className="text-muted-foreground">Take a clear photo of your face for avatar</p>
              </div>

              <div className="bg-muted rounded-xl p-12 flex items-center justify-center">
                <div className="text-6xl">😊</div>
              </div>

              <div className="space-y-3">
                <label htmlFor="face-photo">
                  <Button size="lg" className="w-full" asChild>
                    <span>
                      <Camera className="mr-2 h-5 w-5" />
                      Take Face Photo
                    </span>
                  </Button>
                </label>
                <input
                  id="face-photo"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handlePhotoCapture(e, "face")}
                />
                <Button variant="outline" className="w-full" onClick={() => setStep("side")}>
                  Retake Side Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "measurements" && frontPhoto && sidePhoto && facePhoto && (
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold mb-2">Confirm Your Measurements</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Height (cm)</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g., 165"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Bust (cm)</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                    placeholder="e.g., 90"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Waist (cm)</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="e.g., 70"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Hips (cm)</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                    placeholder="e.g., 95"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handleSaveScan(frontPhoto, sidePhoto, facePhoto, true, true)}
                >
                  Use AI Analysis + Generate Avatar
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSaveScan(frontPhoto, sidePhoto, facePhoto, false, false)}
                >
                  Save Manual Measurements Only
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(step === "processing" || step === "avatar-processing") && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="animate-spin mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full"></div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">
                  {step === "avatar-processing" ? "Generating Your Avatar..." : "Processing..."}
                </h2>
                <p className="text-muted-foreground">This may take a moment</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Body Scan Complete!</h2>
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BodyScan;
