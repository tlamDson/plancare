/**
 * Profile Step Component
 *
 * Step 1: Display name and currency preferences
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "../../constants/onboarding";

interface ProfileStepProps {
  name: string;
  currency: string;
  onNameChange: (name: string) => void;
  onCurrencyChange: (currency: string) => void;
}

export function ProfileStep({
  name,
  currency,
  onNameChange,
  onCurrencyChange,
}: ProfileStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Let's set up your profile</h2>
        <p className="text-muted-foreground">
          Choose how your name appears publicly when sharing trips.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Public nickname / username</Label>
          <Input
            id="displayName"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., nomad.minh"
          />
        </div>

        <div className="space-y-2">
          <Label>Preferred currency</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => onCurrencyChange(c.code)}
                aria-pressed={currency === c.code}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  currency === c.code
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="font-medium">
                  {c.symbol} {c.code}
                </span>
                <p className="text-xs text-muted-foreground">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
