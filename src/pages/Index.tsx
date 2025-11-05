import { Hero } from "@/components/Hero";
import { WardrobeUpload } from "@/components/WardrobeUpload";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <WardrobeUpload />
      <Features />
      <Pricing />
    </div>
  );
};

export default Index;
