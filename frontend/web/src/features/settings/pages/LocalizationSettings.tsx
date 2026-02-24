import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function LocalizationSettings() {
  const [temperature, setTemperature] = useState<"C" | "F">("C");
  const [distance, setDistance] = useState<"Miles" | "Km">("Miles");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English (US)");
  const [autoTranslate, setAutoTranslate] = useState(true);

  useEffect(() => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      );
      if (prefs.currency) setCurrency(prefs.currency);
      if (prefs.temperature) setTemperature(prefs.temperature);
      if (prefs.distance) setDistance(prefs.distance);
      if (prefs.language) setLanguage(prefs.language);
      if (prefs.autoTranslate !== undefined)
        setAutoTranslate(prefs.autoTranslate);
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
          currency,
          temperature,
          distance,
          language,
          autoTranslate,
        }),
      );
      toast.success("Localization settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
    }
  };

  const handleDiscard = () => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      );
      if (prefs.currency) setCurrency(prefs.currency);
      if (prefs.temperature) setTemperature(prefs.temperature);
      if (prefs.distance) setDistance(prefs.distance);
      if (prefs.language) setLanguage(prefs.language);
      if (prefs.autoTranslate !== undefined)
        setAutoTranslate(prefs.autoTranslate);
    } catch (e) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          Localization & Units
        </h3>
        <p className="text-muted-foreground mt-1">
          Customize measurement systems, currency, and language preferences.
        </p>
      </div>

      <Separator />

      <form className="space-y-8">
        {/* Measurement Systems */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Measurements & Units
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Temperature</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred temperature unit.
                </p>
              </div>
              <div className="flex items-center bg-muted p-1 rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemperature("C")}
                  className={`h-7 px-4 ${temperature === "C" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  °C
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemperature("F")}
                  className={`h-7 px-4 ${temperature === "F" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  °F
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Distance</Label>
                <p className="text-sm text-muted-foreground">
                  Used for maps and driving directions.
                </p>
              </div>
              <div className="flex items-center bg-muted p-1 rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDistance("Miles")}
                  className={`h-7 px-4 ${distance === "Miles" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  Miles
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDistance("Km")}
                  className={`h-7 px-4 ${distance === "Km" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  Km
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Default Currency
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used for cost estimates and budgets.
                </p>
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  className="w-32 justify-between"
                  type="button"
                  onClick={() => {
                    const newCurrency =
                      currency === "USD"
                        ? "EUR"
                        : currency === "EUR"
                          ? "GBP"
                          : "USD";
                    setCurrency(newCurrency);
                  }}
                >
                  {currency}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Translation */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            Languages & Translation
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  Primary Language
                </Label>
                <p className="text-sm text-muted-foreground">
                  Your default interface language.
                </p>
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  className="w-32 justify-between"
                  type="button"
                  onClick={() => {
                    const newLang =
                      language === "English (US)"
                        ? "French"
                        : language === "French"
                          ? "Spanish"
                          : "English (US)";
                    setLanguage(newLang);
                  }}
                >
                  {language}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label
                  htmlFor="auto-translate"
                  className="text-base font-medium"
                >
                  Auto-Translate Content
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically translate points of interest and reviews to your
                  primary language.
                </p>
              </div>
              <Switch
                id="auto-translate"
                checked={autoTranslate}
                onCheckedChange={setAutoTranslate}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button variant="outline" type="button" onClick={handleDiscard}>
            Discard
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
