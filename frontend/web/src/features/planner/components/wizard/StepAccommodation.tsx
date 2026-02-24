import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { useTranslationStore } from "@/stores/useTranslationStore";

export function StepAccommodation() {
  const { data, setData } = useTripWizardStore();
  const { t } = useTranslationStore();

  const options = [
    { value: "hotel", label: t("wizard.hotel") },
    { value: "hostel", label: t("wizard.hostel") },
    { value: "airbnb", label: t("wizard.airbnb") },
    { value: "resort", label: t("wizard.resort") },
    { value: "any", label: t("wizard.any") },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>{t("wizard.accType")}</Label>
        <RadioGroup
          value={data.accommodationType}
          onValueChange={(value) =>
            setData({
              accommodationType: value as typeof data.accommodationType,
            })
          }
          className="grid gap-3 sm:grid-cols-2"
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label className="text-sm font-medium">
            {t("wizard.flexibility")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("wizard.flexDesc")}
          </p>
        </div>
        <Switch
          checked={!data.accommodationFlexible}
          onCheckedChange={(checked) =>
            setData({ accommodationFlexible: !checked })
          }
        />
      </div>
    </div>
  );
}
