/**
 * First Trip Step Component
 *
 * Step 3: Optional first trip destination
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FirstTripStepProps {
  destination: string;
  travelers: number;
  onDestinationChange: (destination: string) => void;
  onTravelersChange: (travelers: number) => void;
}

export function FirstTripStep({
  destination,
  travelers,
  onDestinationChange,
  onTravelersChange,
}: FirstTripStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Plan your first trip</h2>
        <p className="text-muted-foreground">
          Where would you like to go? (optional)
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="e.g., Tokyo, Japan"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="travelers">Number of travelers</Label>
          <Input
            id="travelers"
            type="number"
            min={1}
            max={20}
            value={travelers}
            onChange={(e) => onTravelersChange(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
    </div>
  );
}
