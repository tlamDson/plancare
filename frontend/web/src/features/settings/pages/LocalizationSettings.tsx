import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslationStore } from "@/stores/useTranslationStore";

type TemperatureUnit = "C" | "F";
type DistanceUnit = "Miles" | "Km";

function readLocalizationPrefs(): {
  currency: string;
  temperature: TemperatureUnit;
  distance: DistanceUnit;
  language: string;
  autoTranslate: boolean;
} {
  try {
    const prefs = JSON.parse(
      localStorage.getItem("user-preferences") || "{}",
    ) as Record<string, unknown>;
    return {
      currency: typeof prefs.currency === "string" ? prefs.currency : "USD",
      temperature: prefs.temperature === "F" ? "F" : "C",
      distance: prefs.distance === "Km" ? "Km" : "Miles",
      language:
        typeof prefs.language === "string" ? prefs.language : "English (US)",
      autoTranslate:
        typeof prefs.autoTranslate === "boolean" ? prefs.autoTranslate : true,
    };
  } catch {
    return {
      currency: "USD",
      temperature: "C",
      distance: "Miles",
      language: "English (US)",
      autoTranslate: true,
    };
  }
}

const initialPrefs = readLocalizationPrefs();

export function LocalizationSettings() {
  const {
    t,
    setLanguage: setGlobalLanguage,
    setCurrency: setGlobalCurrency,
    setDistanceUnit: setGlobalDistance,
  } = useTranslationStore();

  const [temperature, setTemperature] = useState<TemperatureUnit>(
    initialPrefs.temperature,
  );
  const [distance, setDistance] = useState<DistanceUnit>(initialPrefs.distance);
  const [currency, setCurrency] = useState(initialPrefs.currency);
  const [language, setLanguage] = useState(initialPrefs.language);
  const [autoTranslate, setAutoTranslate] = useState(
    initialPrefs.autoTranslate,
  );

  const handleSave = () => {
    try {
      const prefs = JSON.parse(
        localStorage.getItem("user-preferences") || "{}",
      ) as Record<string, unknown>;
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
      setGlobalLanguage(language as "English (US)" | "French" | "Vietnamese");
      setGlobalCurrency(currency);
      setGlobalDistance(distance);

      toast.success(t("loc.toastSave"));
    } catch {
      toast.error(t("loc.toastFail"));
    }
  };

  const handleDiscard = () => {
    const snap = readLocalizationPrefs();
    setCurrency(snap.currency);
    setTemperature(snap.temperature);
    setDistance(snap.distance);
    setLanguage(snap.language);
    setAutoTranslate(snap.autoTranslate);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          {t("loc.pageTitle")}
        </h3>
        <p className="text-muted-foreground mt-1">{t("loc.pageSubtitle")}</p>
      </div>

      <Separator />

      <form className="space-y-8">
        {/* Measurement Systems */}
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t("loc.measurementsTitle")}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t("loc.temperatureLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("loc.temperatureDesc")}
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
                <Label className="text-base font-medium">
                  {t("loc.distanceLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("loc.distanceDesc")}
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
                  {t("loc.miles")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDistance("Km")}
                  className={`h-7 px-4 ${distance === "Km" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  {t("loc.km")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t("loc.currencyLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("loc.currencyDesc")}
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
                          ? "VND"
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
            {t("loc.languageTitle")}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t("loc.primaryLangLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("loc.primaryLangDesc")}
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
                          ? "Vietnamese"
                          : "English (US)";
                    setLanguage(newLang);
                  }}
                >
                  {language === "English (US)"
                    ? t("loc.english")
                    : language === "French"
                      ? t("loc.french")
                      : t("loc.vietnamese")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm">
              <div className="space-y-0.5">
                <Label
                  htmlFor="auto-translate"
                  className="text-base font-medium"
                >
                  {t("loc.autoTranslateLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("loc.autoTranslateDesc")}
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
            {t("loc.btnDiscard")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("loc.btnSave")}
          </Button>
        </div>
      </form>
    </div>
  );
}
