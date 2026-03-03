import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const PACE_OPTIONS = [
  {
    value: "relaxed" as const,
    icon: "🐢",
    labelKey: "wizard.paceRelaxed",
    descriptionKey: "wizard.paceRelaxedDesc",
  },
  {
    value: "balanced" as const,
    icon: "⚖️",
    labelKey: "wizard.paceBalanced",
    descriptionKey: "wizard.paceBalancedDesc",
  },
  {
    value: "packed" as const,
    icon: "🚀",
    labelKey: "wizard.pacePacked",
    descriptionKey: "wizard.pacePackedDesc",
  },
] as const;

const FOCUS_OPTIONS = [
  {
    value: "Culture" as const,
    icon: "🏛️",
    labelKey: "wizard.focusCulture",
    descriptionKey: "wizard.focusCultureDesc",
  },
  {
    value: "Nature" as const,
    icon: "🌲",
    labelKey: "wizard.focusNature",
    descriptionKey: "wizard.focusNatureDesc",
  },
  {
    value: "Gastronomy" as const,
    icon: "🍜",
    labelKey: "wizard.focusGastronomy",
    descriptionKey: "wizard.focusGastronomyDesc",
  },
  {
    value: "Lifestyle" as const,
    icon: "🛍️",
    labelKey: "wizard.focusLifestyle",
    descriptionKey: "wizard.focusLifestyleDesc",
  },
] as const;

const CONSTRAINT_OPTIONS = [
  {
    id: "mobility_friendly",
    labelKey: "wizard.constraintMobility",
    descriptionKey: "wizard.constraintMobilityDesc",
    incompatibleWith: ["Nature"] as const,
  },
  {
    id: "avoid_crowds",
    labelKey: "wizard.constraintCrowds",
    descriptionKey: "wizard.constraintCrowdsDesc",
    incompatibleWith: [] as const,
  },
  {
    id: "start_late",
    labelKey: "wizard.constraintStartLate",
    descriptionKey: "wizard.constraintStartLateDesc",
    incompatibleWith: [] as const,
  },
  {
    id: "indoor_only",
    labelKey: "wizard.constraintIndoor",
    descriptionKey: "wizard.constraintIndoorDesc",
    incompatibleWith: ["Nature"] as const,
  },
  {
    id: "no_street_food",
    labelKey: "wizard.constraintNoStreetFood",
    descriptionKey: "wizard.constraintNoStreetFoodDesc",
    incompatibleWith: [] as const,
  },
  {
    id: "no_late_nights",
    labelKey: "wizard.constraintNoLateNights",
    descriptionKey: "wizard.constraintNoLateNightsDesc",
    incompatibleWith: ["Lifestyle"] as const,
  },
] as const;

type ConstraintKey = (typeof CONSTRAINT_OPTIONS)[number]["id"];

// ─── Component ────────────────────────────────────────────────────────────────

export function StepActivities() {
  const { data, setData } = useTripWizardStore();
  const { t } = useTranslationStore();

  // ── Focus toggle with conflict handling ──────────────────────────────────
  const handleFocusChange = (newFocus: string[]) => {
    const typed = newFocus.slice(0, 3) as typeof data.focus;

    if (typed.includes("Lifestyle") && data.constraints.no_late_nights) {
      toast.warning(t("wizard.warnLifestyleLateNights"));
    }
    // Warn if avoid_crowds + Lifestyle
    if (typed.includes("Lifestyle") && data.constraints.avoid_crowds) {
      toast.info(t("wizard.infoCrowdsLifestyle"));
    }
    setData({ focus: typed });
  };

  // ── Constraint toggle with conflict handling ─────────────────────────────
  const handleConstraintChange = (key: ConstraintKey, checked: boolean) => {
    const next = { ...data.constraints, [key]: checked };

    // Hard disable: Nature + mobility_friendly or indoor_only → already handled via UI disabled state
    // Soft warnings
    if (key === "avoid_crowds" && checked && data.focus.includes("Lifestyle")) {
      toast.info(t("wizard.infoCrowdsLifestyle"));
    }
    if (
      key === "no_late_nights" &&
      checked &&
      data.focus.includes("Lifestyle")
    ) {
      toast.warning(t("wizard.warnLifestyleLateNights"));
    }

    setData({ constraints: next });
  };

  // A constraint is disabled when the current focus makes it contradictory
  const isConstraintDisabled = (
    constraint: (typeof CONSTRAINT_OPTIONS)[number],
  ): boolean => {
    if (constraint.incompatibleWith.length === 0) return false;
    return constraint.incompatibleWith.some((f) =>
      data.focus.includes(f as any),
    );
  };

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
      {/* A. Pace */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          🎯 {t("wizard.paceLabel")}
        </Label>
        <div className="grid gap-3">
          {PACE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                data.pace === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="pace"
                value={option.value}
                checked={data.pace === option.value}
                onChange={() => setData({ pace: option.value })}
                className="mt-0.5 accent-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium">{t(option.labelKey)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t(option.descriptionKey)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* B. Focus (max 3) */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          🗺️ {t("wizard.focusLabel")}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {t("wizard.focusMax3")}
          </span>
        </Label>
        <ToggleGroup
          type="multiple"
          value={data.focus}
          onValueChange={handleFocusChange}
          className="grid grid-cols-2 gap-3"
        >
          {FOCUS_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              disabled={
                data.focus.length >= 3 && !data.focus.includes(opt.value)
              }
              className="flex h-auto flex-col items-start gap-1 rounded-lg border p-3 text-left data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              <div className="flex items-center gap-2 font-medium">
                <span>{opt.icon}</span>
                <span className="text-sm">{t(opt.labelKey)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(opt.descriptionKey)}
              </p>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* C. Constraints */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          🚫 {t("wizard.constraintsLabel")}
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONSTRAINT_OPTIONS.map((item) => {
            const disabled = isConstraintDisabled(item);
            const checked =
              !disabled && data.constraints[item.id as ConstraintKey];
            return (
              <label
                key={item.id}
                className={`flex items-start gap-2 rounded-md p-2 text-sm ${
                  disabled
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:bg-muted/40"
                }`}
                title={
                  disabled ? t("wizard.constraintIncompatible") : undefined
                }
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(v) =>
                    handleConstraintChange(item.id as ConstraintKey, Boolean(v))
                  }
                  className="mt-0.5"
                />
                <div>
                  <p
                    className={
                      disabled ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {t(item.labelKey)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(item.descriptionKey)}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
