import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { getDocument, setDocument } from "@/integrations/mongodb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shirt, Sparkles } from "lucide-react";

const OCCUPATIONS = [
  "Student - University",
  "Student - High School",
  "Employee",
  "Manager",
  "Senior Manager",
  "Director",
  "Executive",
  "CEO",
  "Entrepreneur",
  "Freelancer",
  "Graphic Designer",
  "Software Developer",
  "Engineer",
  "Architect",
  "Doctor",
  "Nurse",
  "Pharmacist",
  "Lawyer",
  "Consultant",
  "Accountant",
  "Banker",
  "Sales Representative",
  "Customer Service Representative",
  "Teacher",
  "Professor",
  "Researcher",
  "Digital Marketer",
  "Social Media Manager",
  "Content Creator",
  "Photographer",
  "Videographer",
  "Fashion Designer",
  "Model",
  "Stylist",
  "Athlete",
  "Fitness Trainer",
  "Chef",
  "Waiter/Waitress",
  "Flight Attendant",
  "Pilot",
  "Government Employee",
  "Military Personnel",
  "Police Officer",
  "Real Estate Agent",
  "Interior Designer",
  "Human Resources Professional",
  "Project Manager",
  "Administrative Assistant",
  "Writer",
  "Journalist",
  "Artist",
  "Musician",
  "Retired",
  "Homemaker",
  "Other"
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "North Korea", "South Korea",
  "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [stylingPreference, setStylingPreference] = useState<"veiled" | "unveiled" | null>(null);
  const [occupation, setOccupation] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/auth");
      return;
    }
    if (isLoaded && isSignedIn && user) {
      checkExistingProfile();
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const checkExistingProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getDocument("profiles", user.id);
      if (profile && (profile as any).stylingPreference) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log("No existing profile, continuing with onboarding");
    }
    setCheckingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!stylingPreference) {
      toast({
        title: "Please select a preference",
        description: "Choose either Veiled or Unveiled to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please wait",
        description: "Authentication is still loading.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await setDocument("profiles", user.id, {
        fullName: user.fullName || "",
        stylingPreference,
        occupation,
        location,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Profile created!",
        description: "Let's build your digital closet.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display">Welcome to StyleSync</CardTitle>
          <CardDescription>Let's personalize your styling experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Shirt className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">How would you describe your style preference?</h3>
                <p className="text-muted-foreground">This helps us provide personalized outfit recommendations</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStylingPreference("veiled")}
                  className={`p-8 border-2 rounded-lg transition-all hover:border-primary ${
                    stylingPreference === "veiled"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🧕</div>
                    <h4 className="font-semibold mb-2">Veiled</h4>
                    <p className="text-sm text-muted-foreground">I wear hijab</p>
                  </div>
                </button>
                <button
                  onClick={() => setStylingPreference("unveiled")}
                  className={`p-8 border-2 rounded-lg transition-all hover:border-primary ${
                    stylingPreference === "unveiled"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">👗</div>
                    <h4 className="font-semibold mb-2">Unveiled</h4>
                    <p className="text-sm text-muted-foreground">I don't wear hijab</p>
                  </div>
                </button>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!stylingPreference}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Tell us more about yourself</h3>
                <p className="text-muted-foreground">Optional - helps us provide better recommendations</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Select value={occupation} onValueChange={setOccupation}>
                    <SelectTrigger id="occupation">
                      <SelectValue placeholder="Select your occupation" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {OCCUPATIONS.map((occ) => (
                        <SelectItem key={occ} value={occ}>
                          {occ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Place You Live</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSaveProfile} className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
