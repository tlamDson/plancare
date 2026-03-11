import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  fetchDestinations,
  type DestinationCountry,
} from "../../api/destinations.api";

const MIN_DESTINATION = 2;
const OTHER_ID = "other";

export function StepBasics() {
  const { data, setData, setTravelers } = useTripWizardStore();
  const { t, language } = useTranslationStore();
  const { isPro } = useSubscriptionStore();

  const [countryId, setCountryId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [freeText, setFreeText] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Fetch DB-driven destinations from API ────────────────────────────────
  const { data: countries = [] } = useQuery<DestinationCountry[]>({
    queryKey: ["destinations"],
    queryFn: fetchDestinations,
    staleTime: 1000 * 60 * 10, // 10 min cache
  });

  const cities = useMemo(
    () => countries.find((c) => c.idKey === countryId)?.cities ?? [],
    [countries, countryId],
  );

  const showFreeText = countryId === OTHER_ID || cityId === OTHER_ID;

  // ── Parse existing destination into dropdowns on mount (edit trip) ───────
  useEffect(() => {
    if (!data.destination || countries.length === 0) {
      setIsInitializing(false);
      return;
    }

    // Prefer idKeys if stored (e.g. from previous selection)
    if (data.countryIdKey && data.cityIdKey) {
      setCountryId(data.countryIdKey);
      setCityId(data.cityIdKey);
      setIsInitializing(false);
      return;
    }

    // Fallback: parse "City, Country" string against DB data
    const parts = data.destination.split(",").map((s) => s.trim());
    const cityPart = parts[0] ?? "";
    const countryPart = parts[1] ?? "";

    const matchedCountry = countries.find(
      (c) =>
        c.nameEn.toLowerCase() === countryPart.toLowerCase() ||
        c.name.toLowerCase() === countryPart.toLowerCase(),
    );
    if (matchedCountry) {
      setCountryId(matchedCountry.idKey);
      const matchedCity = matchedCountry.cities.find(
        (city) =>
          city.nameEn.toLowerCase() === cityPart.toLowerCase() ||
          city.name.toLowerCase() === cityPart.toLowerCase(),
      );
      if (matchedCity) {
        setCityId(matchedCity.idKey);
      }
    } else if (data.destination) {
      // Legacy free-text destination from before DB feature
      setCountryId(OTHER_ID);
      setFreeText(data.destination);
    }

    setIsInitializing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  // ── Sync selections to store ─────────────────────────────────────────────
  useEffect(() => {
    if (isInitializing) return;

    if (showFreeText) {
      setData({
        destination: freeText.trim(),
        countryIdKey: undefined,
        cityIdKey: undefined,
      });
      return;
    }

    if (countryId && cityId && cityId !== OTHER_ID && countryId !== OTHER_ID) {
      const country = countries.find((c) => c.idKey === countryId);
      const city = country?.cities.find((c) => c.idKey === cityId);
      if (country && city) {
        setData({
          destination: `${city.nameEn}, ${country.nameEn}`,
          countryIdKey: country.idKey,
          cityIdKey: city.idKey,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, cityId, freeText, showFreeText, isInitializing]);

  const onCountryChange = (id: string) => {
    setCountryId(id);
    setCityId("");
    setFreeText("");
    setData({ destination: "", countryIdKey: undefined, cityIdKey: undefined });
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

        {/* Country Select */}
        <Select value={countryId} onValueChange={onCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("wizard.selectCountry")} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c: DestinationCountry) => (
              <SelectItem key={c.idKey} value={c.idKey}>
                {c.flagEmoji && `${c.flagEmoji} `}
                {language === "Vietnamese" ? c.name : c.nameEn}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_ID}>
              🌍 {t("wizard.otherDestination")}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* City Select or Free-text */}
        {countryId && countryId !== OTHER_ID && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger>
                <SelectValue placeholder={t("wizard.selectCity")} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.idKey} value={c.idKey}>
                    {language === "Vietnamese" ? c.name : c.nameEn}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_ID}>
                  ✏️ {t("wizard.otherCity")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Free-text Fallback (Other country or Other city) */}
        {showFreeText && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <Input
              placeholder={t("wizard.cityPlaceholder")}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("wizard.mvpHint")}
            </p>
          </div>
        )}

        {destinationError && !isInitializing && (
          <p className="text-sm text-destructive">{destinationError}</p>
        )}
      </div>

      {/* Travel Dates */}
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
