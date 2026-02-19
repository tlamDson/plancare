import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useTripWizardStore } from "@/stores/trip-wizard.store";

const options = [
  { value: "hotel", label: "Hotel" },
  { value: "hostel", label: "Hostel" },
  { value: "airbnb", label: "Airbnb" },
  { value: "resort", label: "Resort" },
  { value: "any", label: "Any" },
] as const;

export function StepAccommodation() {
  const { data, setData } = useTripWizardStore();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Accommodation Type</Label>
        <RadioGroup
          value={data.accommodationType}
          onValueChange={(value) =>
            setData({ accommodationType: value as typeof data.accommodationType })
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
          <Label className="text-sm font-medium">Flexibility</Label>
          <p className="text-xs text-muted-foreground">
            Toggle if you already have a booking
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
