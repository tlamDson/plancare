import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { DatePicker } from "./DatePicker";
import { addDays } from "date-fns";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { useSubscriptionStore } from "@/stores/useSubscriptionStore";
import {
  COUNTRIES,
  getCitiesForCountry,
  isMVPCountry,
} from "../../constants/destinations";
import type { Country, City } from "../../constants/destinations";
import { parseDestinationToCountryCity } from "../../utils/destination-parser";

const MIN_DESTINATION = 2;

export function StepBasics() {
  const { data, setData, setTravelers } = useTripWizardStore();
  const { t, language } = useTranslationStore();
  const { isPro } = useSubscriptionStore();

  const [countryId, setCountryId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  // Parse existing destination into country/city on mount
  useEffect(() => {
    if (data.destination) {
      const parsed = parseDestinationToCountryCity(data.destination);
      if (parsed.countryId) {
        setCountryId(parsed.countryId);
      }
    }
    setIsInitializing(false);
  }, [data.destination]);

  const cities = getCitiesForCountry(countryId);
  const isMVP = isMVPCountry(countryId);

  const onCountryChange = (id: string) => {
    setCountryId(id);
    setData({ destination: "" });
  };

  const onCityInput = (value: string) => {
    const country = COUNTRIES.find((c: Country) => c.id === countryId);
    if (!country) return;
    const countryName = country.nameEn;
    setData({
      destination: value.trim() ? `${value.trim()}, ${countryName}` : "",
    });
  };

  const destinationError =
    data.destination.trim().length > 0 &&
    data.destination.trim().length < MIN_DESTINATION
      ? t("wizard.destError")
      : null;

  const start = data.startDate ? new Date(data.startDate) : null;
  const end = data.endDate ? new Date(data.endDate) : null;
  const dateError = start && end && end <= start ? t("wizard.dateError") : null;
  const tripDays = useMemo(() => {
    if (!start || !end || end <= start) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [start, end]);
  const isAtFreeCap = !isPro && tripDays === 5;
  const isOverFreeCap = !isPro && tripDays > 5;

  const updateTravelers = (key: "adults" | "children", delta: number) => {
    const nextValue = Math.max(
      key === "adults" ? 1 : 0,
      data.travelers[key] + delta,
    );
    setTravelers({ ...data.travelers, [key]: nextValue });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("wizard.title")}</Label>
        <Input
          id="title"
          placeholder={t("wizard.titlePlaceholder")}
          value={data.title}
          onChange={(e) => setData({ title: e.target.value })}
        />
        {data.title.trim().length > 0 && data.title.trim().length < 2 && (
          <p className="text-sm text-destructive">{t("wizard.titleError")}</p>
        )}
      </div>
      {/* Destination */}
      <div className="space-y-2">
        <Label>{t("wizard.destination")}</Label>

        <Select value={countryId} onValueChange={onCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("wizard.selectCountry")} />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c: Country) => (
              <SelectItem key={c.id} value={c.id}>
                {language === "Vietnamese" ? c.name : c.nameEn}
                {c.isMVP && " ✨"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {countryId && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            {isMVP && cities.length > 0 ? (
              <Select
                value={data.destination}
                onValueChange={(v) => {
                  const city = cities.find((c) => c.destinationValue === v);
                  if (city) setData({ destination: city.destinationValue });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("wizard.selectCity")} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c: City) => (
                    <SelectItem key={c.id} value={c.destinationValue}>
                      {language === "Vietnamese" ? c.name : c.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder={t("wizard.cityPlaceholder")}
                defaultValue={data.destination.split(",")[0]?.trim() || ""}
                onChange={(e) => onCityInput(e.target.value)}
              />
            )}

            {!isMVP && (
              <p className="text-xs text-muted-foreground mt-2">
                {t("wizard.mvpHint")}
              </p>
            )}
          </div>
        )}

        {destinationError && !isInitializing && (
          <p className="text-sm text-destructive">{destinationError}</p>
        )}
      </div>

      {/* Travel Dates — two side-by-side pickers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t("wizard.startDate")}</Label>
          <DatePicker
            value={data.startDate}
            onChange={(date) => setData({ startDate: date })}
            placeholder={t("wizard.pickStartDate")}
            ariaLabel="Start date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t("wizard.endDate")}</Label>
          <DatePicker
            value={data.endDate}
            onChange={(date) => setData({ endDate: date })}
            placeholder={t("wizard.pickEndDate")}
            ariaLabel="End date"
            minDate={
              data.startDate
                ? addDays(new Date(data.startDate + "T00:00:00"), 1)
                : undefined
            }
          />
        </div>
      </div>
      {dateError && <p className="text-sm text-destructive">{dateError}</p>}
      {!dateError && isAtFreeCap && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          {
            "\u{1F4A1} You're at the Free plan maximum (5 days). Upgrade to Pro for longer trips."
          }
        </div>
      )}
      {!dateError && isOverFreeCap && (
        <div className="rounded-md border border-purple-300 bg-gradient-to-r from-purple-50 to-orange-50 p-3 text-sm text-purple-800">
          {`\u2728 ${tripDays}-day itineraries are available on Pro (up to 30 days).`}
        </div>
      )}

      {/* Travelers */}
      <div className="space-y-2">
        <Label>{t("wizard.travelers")}</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="font-medium">{t("wizard.adults")}</p>
              <p className="text-xs text-muted-foreground">
                {t("wizard.adultsAge")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateTravelers("adults", -1)}
                aria-label="Decrease adults"
              >
                -
              </Button>
              <span className="w-6 text-center font-medium">
                {data.travelers.adults}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateTravelers("adults", 1)}
                aria-label="Increase adults"
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="font-medium">{t("wizard.children")}</p>
              <p className="text-xs text-muted-foreground">
                {t("wizard.childrenAge")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateTravelers("children", -1)}
                aria-label="Decrease children"
              >
                -
              </Button>
              <span className="w-6 text-center font-medium">
                {data.travelers.children}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateTravelers("children", 1)}
                aria-label="Increase children"
              >
                +
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
