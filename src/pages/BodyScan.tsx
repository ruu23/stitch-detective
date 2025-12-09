import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, addDocument, uploadFile, invokeFunction } from "@/integrations/firebase";

type ScanStep = "intro" | "front" | "side" | "face" | "measurements" | "avatar-processing" | "processing" | "complete";

const BodyScan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      let aiAnalysis = null;
      const timestamp = Date.now();

      // Convert base64 to blob
      const frontBlob = await fetch(frontUrl).then(r => r.blob());
      const sideBlob = await fetch(sideUrl).then(r => r.blob());
      const faceBlob = await fetch(faceUrl).then(r => r.blob());

      // Upload to Firebase Storage
      const frontPath = `body-scans/${user.uid}/front-${timestamp}.jpg`;
      const sidePath = `body-scans/${user.uid}/side-${timestamp}.jpg`;
      const facePath = `body-scans/${user.uid}/face-${timestamp}.jpg`;

      const [frontPublicUrl, sidePublicUrl, facePublicUrl] = await Promise.all([
        uploadFile(frontPath, frontBlob, "image/jpeg"),
        uploadFile(sidePath, sideBlob, "image/jpeg"),
        uploadFile(facePath, faceBlob, "image/jpeg"),
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
            if (analysisData.estimated_measurements) {
              setHeight(String(analysisData.estimated_measurements.height || ""));
              setBust(String(analysisData.estimated_measurements.bust || ""));
              setWaist(String(analysisData.estimated_measurements.waist || ""));
              setHips(String(analysisData.estimated_measurements.hips || ""));
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

      // Save to Firestore
      const bodyScanData = await addDocument("bodyScans", {
        userId: user.uid,
        frontImageUrl: frontPublicUrl,
        sideImageUrl: sidePublicUrl,
        faceImageUrl: facePublicUrl,
        height: height ? parseFloat(height) : (aiAnalysis?.estimated_measurements?.height || null),
        bust: bust ? parseFloat(bust) : (aiAnalysis?.estimated_measurements?.bust || null),
        waist: waist ? parseFloat(waist) : (aiAnalysis?.estimated_measurements?.waist || null),
        hips: hips ? parseFloat(hips) : (aiAnalysis?.estimated_measurements?.hips || null),
        bodyShape: aiAnalysis?.body_shape || null,
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
            bodyScanId: bodyScanData.id,
          });

          if (avatarData?.success) {
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
                  Take 2 quick photos to get personalized styling
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

              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Front facing photo</p>
                    <p className="text-sm text-muted-foreground">
                      Stand straight, arms at your sides
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Side profile photo</p>
                    <p className="text-sm text-muted-foreground">
                      Turn to the side, maintain posture
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Face close-up</p>
                    <p className="text-sm text-muted-foreground">
                      Clear photo of your face for avatar generation
                    </p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={() => setStep("front")}>
                <Camera className="mr-2 h-5 w-5" />
                Start Body Scan
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate(-1)}
              >
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
                <h2 className="text-2xl font-display font-bold mb-2">
                  Front Photo
                </h2>
                <p className="text-muted-foreground">
                  Stand straight facing the camera
                </p>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("intro")}
                >
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
                <h2 className="text-2xl font-display font-bold mb-2">
                  Side Photo
                </h2>
                <p className="text-muted-foreground">
                  Turn to your side, keep the same posture
                </p>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("front")}
                >
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
                <h2 className="text-2xl font-display font-bold mb-2">
                  Face Close-Up
                </h2>
                <p className="text-muted-foreground">
                  Take a clear photo of your face for hyper-realistic avatar
                </p>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep("side")}
                >
                  Retake Side Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "measurements" && (
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-display font-bold mb-2">
                  Confirm Your Measurements
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g., 165"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Bust (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                    placeholder="e.g., 90"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="e.g., 70"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Hips (cm)
                  </label>
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
                  onClick={() => {
                    if (frontPhoto && sidePhoto && facePhoto) {
                      handleSaveScan(frontPhoto, sidePhoto, facePhoto, true, true);
                    }
                  }}
                >
                  Save & Generate Avatar
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (frontPhoto && sidePhoto && facePhoto) {
                      handleSaveScan(frontPhoto, sidePhoto, facePhoto, true, false);
                    }
                  }}
                >
                  Save Without Avatar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(step === "processing" || step === "avatar-processing") && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">
                  {step === "avatar-processing" ? "Creating Your Avatar" : "Processing"}
                </h2>
                <p className="text-muted-foreground">
                  {step === "avatar-processing" 
                    ? "Generating your hyper-realistic 3D avatar..." 
                    : "Analyzing your photos and saving your measurements..."}
                </p>
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
                <h2 className="text-2xl font-display font-bold mb-2">
                  Body Scan Complete!
                </h2>
                <p className="text-muted-foreground">
                  Your measurements and avatar have been saved.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BodyScan;
