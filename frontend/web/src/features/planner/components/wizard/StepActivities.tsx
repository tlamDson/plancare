import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTripWizardStore } from "@/stores/trip-wizard.store";

const moods = [
  { value: "city_break", label: "City Break" },
  { value: "beach", label: "Beach" },
  { value: "hiking", label: "Hiking" },
  { value: "foodie", label: "Foodie" },
  { value: "romantic", label: "Romantic" },
  { value: "adventure", label: "Adventure" },
] as const;

const interests = [
  "Local food",
  "Museums",
  "Nightlife",
  "Nature",
  "Shopping",
  "Wellness",
  "History",
  "Photography",
  "Live music",
  "Markets",
];

const dealBreakers = [
  "Crowds",
  "Long walks",
  "Early mornings",
  "Public transport",
  "Street food",
  "Late nights",
];

export function StepActivities() {
  const { data, setData } = useTripWizardStore();

  const toggleDealBreaker = (value: string, checked: boolean) => {
    const next = checked
      ? [...data.dealBreakers, value]
      : data.dealBreakers.filter((item) => item !== value);
    setData({ dealBreakers: next });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Mood</Label>
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
        <Label>Interests (up to 5)</Label>
        <ToggleGroup
          type="multiple"
          value={data.interests}
          onValueChange={(value) =>
            setData({ interests: value.slice(0, 5) })
          }
          className="flex flex-wrap justify-start gap-2"
        >
          {interests.map((interest) => (
            <ToggleGroupItem key={interest} value={interest} className="px-3">
              {interest}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <Label>Deal-breakers</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {dealBreakers.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={data.dealBreakers.includes(item)}
                onCheckedChange={(checked) =>
                  toggleDealBreaker(item, Boolean(checked))
                }
              />
              {item}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
