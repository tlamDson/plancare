import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import type { TripWizardData } from "@/stores/trip-wizard.store";
import { StepBasics } from "./wizard/StepBasics";
import { StepBudget } from "./wizard/StepBudget";
import { StepAccommodation } from "./wizard/StepAccommodation";
import { StepTransport } from "./wizard/StepTransport";
import { StepActivities } from "./wizard/StepActivities";
import { StepRequirements } from "./wizard/StepRequirements";
import { useTripWizard } from "../hooks/useTripWizard";
import type { TripPreferences } from "@travelplan/shared";
import { useTranslationStore } from "@/stores/useTranslationStore";

const TOTAL_STEPS = 6;
const MIN_DAILY_BUDGET = 20;
const MAX_TRIP_DAYS = 90;

const steps = [
  { titleKey: "wizard.step1Title", descKey: "wizard.step1Desc" },
  { titleKey: "wizard.step2Title", descKey: "wizard.step2Desc" },
  { titleKey: "wizard.step3Title", descKey: "wizard.step3Desc" },
  { titleKey: "wizard.step4Title", descKey: "wizard.step4Desc" },
  { titleKey: "wizard.step5Title", descKey: "wizard.step5Desc" },
  { titleKey: "wizard.step6Title", descKey: "wizard.step6Desc" },
];

function getTripDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 1 || diffDays > MAX_TRIP_DAYS) return null;
  return diffDays;
}

const PACE_TO_ACTIVITIES: Record<string, number> = {
  relaxed: 2,
  balanced: 4,
  packed: 6,
};

function buildPreferences(data: TripWizardData) {
  const preferences: TripPreferences = {
    destination: data.destination.trim(),
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    budget: {
      total: data.budget.total,
      currency: data.budget.currency,
    },
    travelers: {
      adults: data.travelers.adults,
      children: data.travelers.children,
    },
    accommodationType: data.accommodationType || undefined,
    priorities: data.priorities,
    mood: data.mood || undefined,
    interests: data.interests.length > 0 ? data.interests : undefined,
    dealBreakers: data.dealBreakers.length > 0 ? data.dealBreakers : undefined,
    purpose: data.purpose,
    groupType: data.groupType,
    transportMode: data.transportMode,
    // New Step 5 fields
    pace: data.pace,
    focus: data.focus,
    constraints: data.constraints,
    specialRequirements: data.specialRequirements || undefined,
    activitiesPerDay: PACE_TO_ACTIVITIES[data.pace] ?? 3,
  };

  return preferences;
}

export function CreateTripDialog({ trigger }: { trigger: React.ReactNode }) {
  const navigate = useNavigate();
  const { data, reset } = useTripWizardStore();
  const { t, language } = useTranslationStore();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const { mutate, isPending } = useTripWizard({
    onSuccess: (tripId) => {
      setOpen(false);
      reset();
      setStepIndex(0);
      navigate(`/trips/${tripId}`);
    },
  });

  const stepMeta = steps[stepIndex];
  const progressValue = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  const stepValid = useMemo(() => {
    const tripDays = getTripDays(data.startDate, data.endDate);
    const totalTravelers =
      data.travelers.adults + data.travelers.children * 0.5;
    const budgetPerPersonDay =
      tripDays && totalTravelers > 0
        ? data.budget.total / (tripDays * totalTravelers)
        : null;

    if (stepIndex === 0) {
      return (
        data.destination.trim().length >= 2 &&
        tripDays !== null &&
        data.travelers.adults >= 1
      );
    }

    if (stepIndex === 1) {
      return (
        budgetPerPersonDay !== null && budgetPerPersonDay >= MIN_DAILY_BUDGET
      );
    }

    if (stepIndex === 2) {
      return data.accommodationType !== "";
    }

    if (stepIndex === 3) {
      return !!data.transportMode;
    }

    if (stepIndex === 4) {
      // Pace + at least 1 focus selected
      return !!data.pace && data.focus.length > 0;
    }

    if (stepIndex === 5) {
      // Special requirements step is always optional — always valid
      return true;
    }

    return false;
  }, [data, stepIndex]);

  const handleNext = () => {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const preferences = buildPreferences(data);
    const title = `${t("trips.defaultTitle")} ${preferences.destination}`;

    console.log(
      "🚀 [CreateTripDialog] Submitting trip with preferences:",
      preferences,
      "language:",
      language,
    );
    console.log("📊 [CreateTripDialog] Wizard data before building:", data);
    mutate({ preferences, language, title });
  };

  const renderStep = () => {
    if (stepIndex === 0) return <StepBasics />;
    if (stepIndex === 1) return <StepBudget />;
    if (stepIndex === 2) return <StepAccommodation />;
    if (stepIndex === 3) return <StepTransport />;
    if (stepIndex === 4) return <StepActivities />;
    return <StepRequirements />;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
          setStepIndex(0);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(stepMeta.titleKey)}</DialogTitle>
          <DialogDescription>{t(stepMeta.descKey)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Progress value={progressValue} />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("wizard.step")} {stepIndex + 1} {t("wizard.of")} {TOTAL_STEPS}
            </p>
          </div>
          {renderStep()}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              setStepIndex(0);
            }}
          >
            {t("wizard.btnReset")}
          </Button>
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={stepIndex === 0}
          >
            {t("wizard.btnBack")}
          </Button>
          {stepIndex < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext} disabled={!stepValid}>
              {t("wizard.btnNext")}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!stepValid || isPending}>
              {isPending ? t("wizard.btnCreating") : t("wizard.btnCreate")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
