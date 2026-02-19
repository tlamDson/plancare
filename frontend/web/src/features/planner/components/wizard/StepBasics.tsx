import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTripWizardStore } from "@/stores/trip-wizard.store";
import { DatePicker } from "./DatePicker";
import { addDays } from "date-fns";

const MIN_DESTINATION = 2;

export function StepBasics() {
  const { data, setData, setTravelers } = useTripWizardStore();

  const destinationError =
    data.destination.trim().length > 0 &&
    data.destination.trim().length < MIN_DESTINATION
      ? "Destination must be at least 2 characters"
      : null;

  const start = data.startDate ? new Date(data.startDate) : null;
  const end = data.endDate ? new Date(data.endDate) : null;
  const dateError =
    start && end && end <= start
      ? "End date must be after the start date"
      : null;

  const updateTravelers = (key: "adults" | "children", delta: number) => {
    const nextValue = Math.max(
      key === "adults" ? 1 : 0,
      data.travelers[key] + delta,
    );
    setTravelers({ ...data.travelers, [key]: nextValue });
  };

  return (
    <div className="space-y-6">
      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          placeholder="e.g., Kyoto, Japan"
          value={data.destination}
          onChange={(e) => setData({ destination: e.target.value })}
        />
        {destinationError && (
          <p className="text-sm text-destructive">{destinationError}</p>
        )}
      </div>

      {/* Travel Dates — two side-by-side pickers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <DatePicker
            value={data.startDate}
            onChange={(date) => setData({ startDate: date })}
            placeholder="Pick start date"
            ariaLabel="Start date"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <DatePicker
            value={data.endDate}
            onChange={(date) => setData({ endDate: date })}
            placeholder="Pick end date"
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

      {/* Travelers */}
      <div className="space-y-2">
        <Label>Travelers</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="font-medium">Adults</p>
              <p className="text-xs text-muted-foreground">Ages 13+</p>
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
              <p className="font-medium">Children</p>
              <p className="text-xs text-muted-foreground">Ages 0-12</p>
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
