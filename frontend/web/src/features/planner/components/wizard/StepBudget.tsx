import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { useTranslationStore } from "@/stores/useTranslationStore";
import { convertCurrency } from "@/utils/format";
import { differenceInDays } from "date-fns";

const BASE_MIN_USD = 200;
const BASE_MAX_USD = 10_000;
const BASE_MIN_DAILY_USD = 20;
const BASE_STEP_USD = 100;

function getTripDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  // +1 to count both start and end as activity days (consistent with getTripDuration)
  const days = differenceInDays(end, start) + 1;
  return days >= 1 ? days : null;
}

export function StepBudget() {
  const { data, setBudget, setPriorities } = useTripWizardStore();
  const { t } = useTranslationStore();

  const currency = data.budget.currency;

  // Scale slider range from the USD base to the active currency
  const sliderMin = Math.round(convertCurrency(BASE_MIN_USD, "USD", currency));
  const sliderMax = Math.round(convertCurrency(BASE_MAX_USD, "USD", currency));
  const sliderStep = Math.round(
    convertCurrency(BASE_STEP_USD, "USD", currency),
  );
  const minDailyBudget = Math.round(
    convertCurrency(BASE_MIN_DAILY_USD, "USD", currency),
  );

  const tripDays = getTripDays(data.startDate, data.endDate);
  const totalTravelers = data.travelers.adults + data.travelers.children * 0.5;
  const budgetPerPersonDay =
    tripDays && totalTravelers > 0
      ? data.budget.total / (tripDays * totalTravelers)
      : null;

  const formattedBudget = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(data.budget.total);

  const formattedPerDay =
    budgetPerPersonDay !== null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(budgetPerPersonDay)
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("wizard.totalBudget")}</Label>
          <span className="text-sm font-medium">{formattedBudget}</span>
        </div>
        <Slider
          value={[data.budget.total]}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          onValueChange={(value) =>
            setBudget({ ...data.budget, total: value[0] })
          }
        />
        {formattedPerDay !== null && (
          <p
            className={`text-sm ${
              budgetPerPersonDay! < minDailyBudget
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {`~${formattedPerDay}${t("wizard.personDay")}`}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("wizard.moneyPriority")}</Label>
          <Slider
            value={[data.priorities.money]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) =>
              setPriorities({ ...data.priorities, money: value[0] })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t("wizard.comfortPriority")}</Label>
          <Slider
            value={[data.priorities.comfort]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) =>
              setPriorities({ ...data.priorities, comfort: value[0] })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t("wizard.uniquePriority")}</Label>
          <Slider
            value={[data.priorities.unique]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) =>
              setPriorities({ ...data.priorities, unique: value[0] })
            }
          />
        </div>
      </div>
    </div>
  );
}
