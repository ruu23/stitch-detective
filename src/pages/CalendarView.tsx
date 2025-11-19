import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";

interface CalendarLook {
  id: string;
  scheduled_date: string;
  activity?: string;
  outfit_id?: string;
}

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduledLooks, setScheduledLooks] = useState<CalendarLook[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadScheduledLooks();
  }, []);

  const loadScheduledLooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      navigate("/onboarding");
      return;
    }

    const { data } = await supabase
      .from("calendar_looks")
      .select("*")
      .eq("user_id", profile.id)
      .order("scheduled_date", { ascending: true });

    setScheduledLooks(data || []);
    setLoading(false);
  };

  const selectedDateLooks = scheduledLooks.filter(
    (look) => selectedDate && format(new Date(look.scheduled_date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-semibold">Calendar</h1>
          <Button size="icon" variant="outline">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {selectedDate && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {format(selectedDate, "MMMM d, yyyy")}
            </h2>

            {selectedDateLooks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No outfits planned for this day
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule an Outfit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              selectedDateLooks.map((look) => (
                <Card key={look.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{look.activity || "Scheduled Look"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(look.scheduled_date), "h:mm a")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Outfit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default CalendarView;