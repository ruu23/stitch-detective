import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ScanStep = "intro" | "front" | "side" | "measurements" | "processing" | "complete";

const BodyScan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<ScanStep>("intro");
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [height, setHeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const handlePhotoCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "side"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === "front") {
        setFrontPhoto(result);
        setStep("side");
      } else {
        setSidePhoto(result);
        setStep("measurements");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveScan = async (frontUrl: string, sideUrl: string, useAI: boolean = false) => {
    try {
      setStep("processing");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Convert base64 to blob
      const frontBlob = await fetch(frontUrl).then(r => r.blob());
      const sideBlob = await fetch(sideUrl).then(r => r.blob());

      // Upload to storage
      const timestamp = Date.now();
      const frontPath = `${user.id}/front-${timestamp}.jpg`;
      const sidePath = `${user.id}/side-${timestamp}.jpg`;

      // Create storage bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const scanBucketExists = buckets?.some(b => b.name === 'body-scans');
      
      if (!scanBucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket('body-scans', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });
        if (bucketError) console.error('Bucket creation error:', bucketError);
      }

      const [frontUpload, sideUpload] = await Promise.all([
        supabase.storage.from("body-scans").upload(frontPath, frontBlob),
        supabase.storage.from("body-scans").upload(sidePath, sideBlob),
      ]);

      if (frontUpload.error) throw frontUpload.error;
      if (sideUpload.error) throw sideUpload.error;

      const { data: { publicUrl: frontPublicUrl } } = supabase.storage
        .from("body-scans")
        .getPublicUrl(frontUpload.data.path);

      const { data: { publicUrl: sidePublicUrl } } = supabase.storage
        .from("body-scans")
        .getPublicUrl(sideUpload.data.path);

      // Save to database
      const { error: dbError } = await supabase.from("body_scans").insert({
        user_id: user.id,
        front_image_url: frontPublicUrl,
        side_image_url: sidePublicUrl,
        height: height ? parseFloat(height) : null,
        bust: bust ? parseFloat(bust) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
      });

      if (dbError) throw dbError;

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
                <div className="flex justify-center gap-8">
                  <div className="text-center space-y-2">
                    <div className="w-24 h-32 bg-background rounded-lg flex items-center justify-center mx-auto">
                      <div className="text-4xl">🧍</div>
                    </div>
                    <p className="text-sm font-medium">Front</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-24 h-32 bg-background rounded-lg flex items-center justify-center mx-auto">
                      <div className="text-4xl">🚶</div>
                    </div>
                    <p className="text-sm font-medium">Side</p>
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
                    placeholder="165"
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
                    placeholder="90"
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
                    placeholder="70"
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
                    placeholder="95"
                  />
                </div>
              </div>

              <a
                href="https://www.youtube.com/results?search_query=how+to+measure+yourself+for+clothing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block text-center"
              >
                How to measure yourself correctly
              </a>

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handleSaveScan(frontPhoto!, sidePhoto!, true)}
                >
                  Use AI Estimation
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => handleSaveScan(frontPhoto!, sidePhoto!, false)}
                >
                  Enter Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "processing" && (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                Processing your scan...
              </h2>
              <p className="text-muted-foreground">
                This will only take a moment
              </p>
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold">
                All set!
              </h2>
              <p className="text-muted-foreground">
                Your body scan has been saved successfully
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BodyScan;
