import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { useTranslationStore } from "@/stores/useTranslationStore";

export function StepActivities() {
  const { data, setData } = useTripWizardStore();
  const { t } = useTranslationStore();

  const moods = [
    { value: "city_break", label: t("wizard.cityBreak") },
    { value: "beach", label: t("wizard.beach") },
    { value: "hiking", label: t("wizard.hiking") },
    { value: "foodie", label: t("wizard.foodie") },
    { value: "romantic", label: t("wizard.romantic") },
    { value: "adventure", label: t("wizard.adventure") },
  ] as const;

  const interests = [
    { value: "Local food", label: t("wizard.int_localFood") },
    { value: "Museums", label: t("wizard.int_museums") },
    { value: "Nightlife", label: t("wizard.int_nightlife") },
    { value: "Nature", label: t("wizard.int_nature") },
    { value: "Shopping", label: t("wizard.int_shopping") },
    { value: "Wellness", label: t("wizard.int_wellness") },
    { value: "History", label: t("wizard.int_history") },
    { value: "Photography", label: t("wizard.int_photography") },
    { value: "Live music", label: t("wizard.int_liveMusic") },
    { value: "Markets", label: t("wizard.int_markets") },
  ];

  const dealBreakers = [
    { value: "Crowds", label: t("wizard.db_crowds") },
    { value: "Long walks", label: t("wizard.db_longWalks") },
    { value: "Early mornings", label: t("wizard.db_earlyMornings") },
    { value: "Public transport", label: t("wizard.db_publicTransport") },
    { value: "Street food", label: t("wizard.db_streetFood") },
    { value: "Late nights", label: t("wizard.db_lateNights") },
  ];

  const toggleDealBreaker = (value: string, checked: boolean) => {
    const next = checked
      ? [...data.dealBreakers, value]
      : data.dealBreakers.filter((item) => item !== value);
    setData({ dealBreakers: next });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>{t("wizard.mood")}</Label>
        <ToggleGroup
          type="single"
          value={data.mood}
          onValueChange={(value) =>
            setData({ mood: value as typeof data.mood })
          }
          className="flex flex-wrap justify-start gap-2"
        >
          {moods.map((mood) => (
            <ToggleGroupItem
              key={mood.value}
              value={mood.value}
              className="px-3"
            >
              {mood.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <Label>{t("wizard.interests")}</Label>
        <ToggleGroup
          type="multiple"
          value={data.interests}
          onValueChange={(value) => setData({ interests: value.slice(0, 5) })}
          className="flex flex-wrap justify-start gap-2"
        >
          {interests.map((interest) => (
            <ToggleGroupItem
              key={interest.value}
              value={interest.value}
              className="px-3"
            >
              {interest.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <Label>{t("wizard.dealBreakers")}</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {dealBreakers.map((item) => (
            <label key={item.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={data.dealBreakers.includes(item.value)}
                onCheckedChange={(checked) =>
                  toggleDealBreaker(item.value, Boolean(checked))
                }
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
