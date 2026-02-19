import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useTripWizardStore } from "@/stores/trip-wizard.store";

const MIN_BUDGET = 500;
const MAX_BUDGET = 10000;
const MIN_DAILY_BUDGET = 20;

function getTripDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 1 ? diffDays : null;
}

export function StepBudget() {
  const { data, setBudget, setPriorities } = useTripWizardStore();

  const tripDays = getTripDays(data.startDate, data.endDate);
  const totalTravelers = data.travelers.adults + data.travelers.children * 0.5;
  const budgetPerPersonDay =
    tripDays && totalTravelers > 0
      ? data.budget.total / (tripDays * totalTravelers)
      : null;

  const formattedBudget = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: data.budget.currency,
    maximumFractionDigits: 0,
  }).format(data.budget.total);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Total Budget</Label>
          <span className="text-sm font-medium">{formattedBudget}</span>
        </div>
        <Slider
          value={[data.budget.total]}
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={100}
          onValueChange={(value) =>
            setBudget({ ...data.budget, total: value[0] })
          }
        />
        {budgetPerPersonDay !== null && (
          <p
            className={`text-sm ${
              budgetPerPersonDay < MIN_DAILY_BUDGET
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {`~${budgetPerPersonDay.toFixed(0)} ${data.budget.currency}/person/day`}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Money Priority</Label>
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
          <Label>Comfort Priority</Label>
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
          <Label>Unique Priority</Label>
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
