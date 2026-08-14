import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { useTranslationStore } from "@/stores/useTranslationStore";

const TRANSPORT_OPTIONS = [
  {
    value: "walking" as const,
    icon: "🚶",
    labelKey: "wizard.transportWalking",
    descKey: "wizard.transportWalkingDesc",
  },
  {
    value: "public_transport" as const,
    icon: "🚇",
    labelKey: "wizard.transportPublic",
    descKey: "wizard.transportPublicDesc",
  },
  {
    value: "car" as const,
    icon: "🚗",
    labelKey: "wizard.transportCar",
    descKey: "wizard.transportCarDesc",
  },
] as const;

export function StepTransport() {
  const { data, setData } = useTripWizardStore();
  const { t } = useTranslationStore();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          {t("wizard.transportLabel")}
        </Label>
        <p className="text-sm text-muted-foreground">
          {t("wizard.transportLabelDesc")}
        </p>

        <RadioGroup
          value={data.transportMode}
          onValueChange={(value) =>
            setData({
              transportMode: value as typeof data.transportMode,
            })
          }
          className="grid gap-3"
        >
          {TRANSPORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`transport-${option.value}`}
              className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                data.transportMode === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <RadioGroupItem
                value={option.value}
                id={`transport-${option.value}`}
                data-testid={`trip-wizard-transport-${option.value}`}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">
                    {option.icon}
                  </span>
                  <span className="font-medium">{t(option.labelKey)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t(option.descKey)}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
