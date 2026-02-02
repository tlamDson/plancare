/**
 * Password Strength Indicator Component
 *
 * Real-time visual feedback for password strength
 */

import type { PasswordStrength } from "../utils/password";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
}

export function PasswordStrengthIndicator({
  strength,
}: PasswordStrengthIndicatorProps) {
  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
              index < strength.score ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Strength Label & Tips */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`font-medium ${
            strength.score < 2
              ? "text-destructive"
              : strength.score < 3
                ? "text-yellow-600"
                : "text-green-600"
          }`}
        >
          {strength.label}
        </span>

        {/* Quick tips */}
        {strength.score < 3 && (
          <span className="text-muted-foreground">
            {!strength.checks.hasUppercase && "Add uppercase • "}
            {!strength.checks.hasNumber && "Add number • "}
            {!strength.checks.hasSpecial && "Add symbol"}
          </span>
        )}
      </div>
    </div>
  );
}
