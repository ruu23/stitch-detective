import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDocuments } from "@/integrations/mongodb";
import { Loader2, RotateCcw } from "lucide-react";

interface AvatarViewerProps {
  userId?: string;
  className?: string;
}

export const AvatarViewer = ({ userId, className }: AvatarViewerProps) => {
  const { user } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    loadAvatar();
  }, [userId, user]);

  const loadAvatar = async () => {
    try {
      setLoading(true);
      
      let targetUserId = userId;
      if (!targetUserId && user) {
        targetUserId = user.id;
      }
      
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      const avatars = await getDocuments<{ avatarModelUrl: string }>("avatars", { userId: targetUserId });

      if (avatars && avatars.length > 0 && avatars[0].avatarModelUrl) {
        setAvatarUrl(avatars[0].avatarModelUrl);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!avatarUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl mb-4">🧍</div>
          <div>
            <h3 className="font-semibold mb-2">No Avatar Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete a body scan to generate your 3D avatar
            </p>
            <Button onClick={() => window.location.href = '/body-scan'}>
              Create Avatar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Your 3D Avatar</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRotation(prev => prev + 90)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          <iframe
            src={`${avatarUrl}?scene=fullbody-portrait-v1-transparent&rotation=${rotation}`}
            allow="camera *; microphone *"
            className="w-full h-full border-0"
            title="3D Avatar"
          />
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Powered by Ready Player Me
        </div>
      </CardContent>
    </Card>
  );
};
