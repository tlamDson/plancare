import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function TravelPreferencesSettings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          Travel & Booking Preferences
        </h3>
        <p className="text-muted-foreground mt-1">
          Store your default settings to tailor the AI agent's itineraries
          perfectly to your liking.
        </p>
      </div>

      <Separator />

      <form className="space-y-10">
        {/* Booking Specifics */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Booking Specifics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-2">
              <Label htmlFor="seat-choice">Air Travel: Seat Preference</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800"
                >
                  Aisle
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Window
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Middle
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-airport">Default Departure Airport</Label>
              <Input id="default-airport" placeholder="e.g., JFK, LHR, SFO" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal">Special Meals</Label>
              <Input
                id="meal"
                placeholder="e.g., Vegetarian, Halal, Gluten-Free"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-room">Hotel Room Preference</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800"
                >
                  1 Bed
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  2 Beds
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm col-span-full">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="smoking" className="text-base font-medium">
                  Smoking Preference
                </Label>
                <p className="text-sm text-muted-foreground mb-0">
                  Allow booking smoking-friendly rooms.
                </p>
              </div>
              <Switch id="smoking" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm col-span-full">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="accessible" className="text-base font-medium">
                  Accessibility Needs
                </Label>
                <p className="text-sm text-muted-foreground mb-0">
                  Prioritize wheelchair-accessible hotels and transportation.
                </p>
              </div>
              <Switch id="accessible" />
            </div>
          </div>
        </section>

        {/* Loyalty Programs */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Loyalty Programs
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delta">Delta SkyMiles</Label>
              <Input id="delta" placeholder="Member Number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="united">United MileagePlus</Label>
              <Input id="united" placeholder="Member Number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marriott">Marriott Bonvoy</Label>
              <Input id="marriott" placeholder="Member Number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hertz">Hertz Gold Plus</Label>
              <Input id="hertz" placeholder="Member Number" />
            </div>
          </div>
          <Button variant="link" className="px-0">
            Add another program...
          </Button>
        </section>

        {/* Routing Preferences */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Routing Preferences
          </h4>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Default Travel Mode</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-zinc-100 dark:bg-zinc-800"
                >
                  Transit
                </Button>
                <Button type="button" variant="outline" className="">
                  Driving
                </Button>
                <Button type="button" variant="outline" className="">
                  Walking
                </Button>
                <Button type="button" variant="outline" className="">
                  Cycling
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="avoid-tolls" className="text-base font-medium">
                  Avoid Tolls
                </Label>
                <p className="text-sm text-muted-foreground">
                  Default to routes without toll roads.
                </p>
              </div>
              <Switch id="avoid-tolls" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="avoid-traffic"
                  className="text-base font-medium"
                >
                  Avoid Heavy Traffic
                </Label>
                <p className="text-sm text-muted-foreground">
                  Reroute around known congestion.
                </p>
              </div>
              <Switch id="avoid-traffic" />
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 border-t pt-6 pb-20">
          <Button variant="outline" type="button">
            Discard
          </Button>
          <Button type="button">Save Preferences</Button>
        </div>
      </form>
    </div>
  );
}
