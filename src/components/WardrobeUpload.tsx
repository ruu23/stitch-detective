import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Image, Shirt, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedItem {
  id: string;
  preview: string;
  file: File;
}

export const WardrobeUpload = () => {
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please upload only image files",
        variant: "destructive"
      });
      return;
    }
    
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const newItems: UploadedItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      file
    }));
    
    setItems(prev => [...prev, ...newItems]);
    toast({
      title: "Items uploaded",
      description: `${files.length} item${files.length > 1 ? 's' : ''} added to your wardrobe`
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Your Digital Closet Awaits</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Snap photos of your clothes. Our AI instantly tags colors, styles, and categories — 
            so you can see everything you own in one place.
          </p>
        </div>

        <Card 
          className={`p-12 border-2 border-dashed transition-all duration-300 ${
            isDragging 
              ? 'border-accent bg-accent/5 shadow-accent' 
              : 'border-border bg-card/50 shadow-soft'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                <Upload className="w-10 h-10 text-accent" />
              </div>
              {isDragging && (
                <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {isDragging ? 'Drop your items here' : 'Upload your wardrobe items'}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop images, or click to browse
              </p>
            </div>

            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <Button 
              variant="accent" 
              size="lg"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Image className="w-5 h-5" />
              Select Photos
            </Button>
          </div>
        </Card>

        {items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <Shirt className="w-6 h-6 text-accent" />
                Your Items ({items.length})
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setItems([])}
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map(item => (
                <div 
                  key={item.id} 
                  className="relative group animate-fade-in"
                >
                  <Card className="overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
                    <div className="aspect-square relative">
                      <img
                        src={item.preview}
                        alt="Wardrobe item"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-destructive/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-destructive-foreground" />
                      </button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <Button variant="accent" size="lg" className="w-full">
              Analyze & Add to Wardrobe
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
