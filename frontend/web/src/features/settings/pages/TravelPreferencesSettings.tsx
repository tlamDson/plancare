import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function TravelPreferencesSettings() {
  // From Onboarding
  const [travelStyle, setTravelStyle] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // App-specific preferences
  const [seatChoice, setSeatChoice] = useState<"Aisle" | "Window" | "Middle">(
    "Aisle",
  );
  const [defaultAirport, setDefaultAirport] = useState("");
  const [specialMeals, setSpecialMeals] = useState("");
  const [hotelRoom, setHotelRoom] = useState<"1 Bed" | "2 Beds">("1 Bed");
  const [smoking, setSmoking] = useState(false);
  const [accessible, setAccessible] = useState(false);

  const [loyaltyDelta, setLoyaltyDelta] = useState("");
  const [loyaltyUnited, setLoyaltyUnited] = useState("");
  const [loyaltyMarriott, setLoyaltyMarriott] = useState("");
  const [loyaltyHertz, setLoyaltyHertz] = useState("");

  const [travelMode, setTravelMode] = useState<
    "Transit" | "Driving" | "Walking" | "Cycling"
  >("Transit");
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidTraffic, setAvoidTraffic] = useState(false);

  useEffect(() => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      );
      if (prefs.travelStyle) setTravelStyle(prefs.travelStyle);
      if (prefs.interests) setInterests(prefs.interests);

      if (prefs.seatChoice) setSeatChoice(prefs.seatChoice);
      if (prefs.defaultAirport) setDefaultAirport(prefs.defaultAirport);
      if (prefs.specialMeals) setSpecialMeals(prefs.specialMeals);
      if (prefs.hotelRoom) setHotelRoom(prefs.hotelRoom);
      if (prefs.smoking !== undefined) setSmoking(prefs.smoking);
      if (prefs.accessible !== undefined) setAccessible(prefs.accessible);

      if (prefs.loyaltyDelta) setLoyaltyDelta(prefs.loyaltyDelta);
      if (prefs.loyaltyUnited) setLoyaltyUnited(prefs.loyaltyUnited);
      if (prefs.loyaltyMarriott) setLoyaltyMarriott(prefs.loyaltyMarriott);
      if (prefs.loyaltyHertz) setLoyaltyHertz(prefs.loyaltyHertz);

      if (prefs.travelMode) setTravelMode(prefs.travelMode);
      if (prefs.avoidTolls !== undefined) setAvoidTolls(prefs.avoidTolls);
      if (prefs.avoidTraffic !== undefined) setAvoidTraffic(prefs.avoidTraffic);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = () => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      );
      localStorage.setItem(
        "user-preferences",
        JSON.stringify({
          ...prefs,
          travelStyle,
          interests,
          seatChoice,
          defaultAirport,
          specialMeals,
          hotelRoom,
          smoking,
          accessible,
          loyaltyDelta,
          loyaltyUnited,
          loyaltyMarriott,
          loyaltyHertz,
          travelMode,
          avoidTolls,
          avoidTraffic,
        }),
      );
      toast.success("Travel preferences saved");
    } catch (e) {
      toast.error("Failed to save preferences");
    }
  };

  const handleDiscard = () => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      );
      if (prefs.travelStyle) setTravelStyle(prefs.travelStyle);
      if (prefs.interests) setInterests(prefs.interests);

      if (prefs.seatChoice) setSeatChoice(prefs.seatChoice);
      if (prefs.defaultAirport) setDefaultAirport(prefs.defaultAirport);
      if (prefs.specialMeals) setSpecialMeals(prefs.specialMeals);
      if (prefs.hotelRoom) setHotelRoom(prefs.hotelRoom);
      if (prefs.smoking !== undefined) setSmoking(prefs.smoking);
      if (prefs.accessible !== undefined) setAccessible(prefs.accessible);

      if (prefs.loyaltyDelta) setLoyaltyDelta(prefs.loyaltyDelta);
      if (prefs.loyaltyUnited) setLoyaltyUnited(prefs.loyaltyUnited);
      if (prefs.loyaltyMarriott) setLoyaltyMarriott(prefs.loyaltyMarriott);
      if (prefs.loyaltyHertz) setLoyaltyHertz(prefs.loyaltyHertz);

      if (prefs.travelMode) setTravelMode(prefs.travelMode);
      if (prefs.avoidTolls !== undefined) setAvoidTolls(prefs.avoidTolls);
      if (prefs.avoidTraffic !== undefined) setAvoidTraffic(prefs.avoidTraffic);
    } catch (e) {}
  };

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
        {/* Onboarding Overview */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            General Travel Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 border bg-card p-4 rounded-lg shadow-sm">
            <div className="space-y-2 col-span-full">
              <Label>Travel Style (From Onboarding)</Label>
              <div className="flex gap-2 p-2 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">
                  {travelStyle || "Not selected"}
                </span>
              </div>
            </div>
            <div className="space-y-2 col-span-full">
              <Label>Interests (From Onboarding)</Label>
              <div className="flex flex-wrap gap-2">
                {interests.length > 0 ? (
                  interests.map((i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                    >
                      {i}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground p-2">
                    None selected
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

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
                  onClick={() => setSeatChoice("Aisle")}
                  className={`flex-1 ${seatChoice === "Aisle" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                >
                  Aisle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 ${seatChoice === "Window" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                  onClick={() => setSeatChoice("Window")}
                >
                  Window
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 ${seatChoice === "Middle" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                  onClick={() => setSeatChoice("Middle")}
                >
                  Middle
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-airport">Default Departure Airport</Label>
              <Input
                id="default-airport"
                placeholder="e.g., JFK, LHR, SFO"
                value={defaultAirport}
                onChange={(e) => setDefaultAirport(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal">Special Meals</Label>
              <Input
                id="meal"
                placeholder="e.g., Vegetarian, Halal, Gluten-Free"
                value={specialMeals}
                onChange={(e) => setSpecialMeals(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotel-room">Hotel Room Preference</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHotelRoom("1 Bed")}
                  className={`flex-1 ${hotelRoom === "1 Bed" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                >
                  1 Bed
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 ${hotelRoom === "2 Beds" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                  onClick={() => setHotelRoom("2 Beds")}
                >
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
              <Switch
                id="smoking"
                checked={smoking}
                onCheckedChange={setSmoking}
              />
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
              <Switch
                id="accessible"
                checked={accessible}
                onCheckedChange={setAccessible}
              />
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
              <Input
                id="delta"
                placeholder="Member Number"
                value={loyaltyDelta}
                onChange={(e) => setLoyaltyDelta(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="united">United MileagePlus</Label>
              <Input
                id="united"
                placeholder="Member Number"
                value={loyaltyUnited}
                onChange={(e) => setLoyaltyUnited(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marriott">Marriott Bonvoy</Label>
              <Input
                id="marriott"
                placeholder="Member Number"
                value={loyaltyMarriott}
                onChange={(e) => setLoyaltyMarriott(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hertz">Hertz Gold Plus</Label>
              <Input
                id="hertz"
                placeholder="Member Number"
                value={loyaltyHertz}
                onChange={(e) => setLoyaltyHertz(e.target.value)}
              />
            </div>
          </div>
          <Button variant="link" className="px-0" type="button">
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
                  onClick={() => setTravelMode("Transit")}
                  className={
                    travelMode === "Transit"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : ""
                  }
                >
                  Transit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    travelMode === "Driving"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : ""
                  }
                  onClick={() => setTravelMode("Driving")}
                >
                  Driving
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    travelMode === "Walking"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : ""
                  }
                  onClick={() => setTravelMode("Walking")}
                >
                  Walking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    travelMode === "Cycling"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : ""
                  }
                  onClick={() => setTravelMode("Cycling")}
                >
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
              <Switch
                id="avoid-tolls"
                checked={avoidTolls}
                onCheckedChange={setAvoidTolls}
              />
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
              <Switch
                id="avoid-traffic"
                checked={avoidTraffic}
                onCheckedChange={setAvoidTraffic}
              />
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 border-t pt-6 pb-20">
          <Button variant="outline" type="button" onClick={handleDiscard}>
            Discard
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
