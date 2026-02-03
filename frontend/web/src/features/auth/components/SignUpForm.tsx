/**
 * Sign Up Form Component
 *
 * Email/password registration form with validation and strength indicator
 */

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import {
  signUpFormSchema,
  type SignUpFormData,
  type SignUpError,
} from "../types";
import {
  checkPasswordStrength,
  type PasswordStrength,
} from "../utils/password";

interface SignUpFormProps {
  isLoaded: boolean;
  isSubmitting: boolean;
  signUpError: SignUpError | null;
  onSubmit: (data: SignUpFormData) => Promise<void>;
  onClearError: (field: "email" | "password") => void;
}

export function SignUpForm({
  isLoaded,
  isSubmitting,
  signUpError,
  onSubmit,
  onClearError,
}: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
  });

  // Real-time password strength check
  const watchedPassword = useWatch({ control, name: "password" });
  useEffect(() => {
    if (watchedPassword) {
      setPasswordStrength(checkPasswordStrength(watchedPassword));
      if (signUpError?.field === "password") {
        onClearError("password");
      }
    } else {
      setPasswordStrength(null);
    }
  }, [watchedPassword, signUpError?.field, onClearError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            autoComplete="given-name"
            {...register("firstName")}
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive" role="alert">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            autoComplete="family-name"
            {...register("lastName")}
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive" role="alert">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register("email")}
          aria-invalid={!!errors.email || signUpError?.field === "email"}
          className={
            signUpError?.field === "email"
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
          onChange={() =>
            signUpError?.field === "email" && onClearError("email")
          }
        />
        {errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
        {signUpError?.field === "email" && !errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {signUpError.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("password")}
            aria-invalid={
              !!errors.password || signUpError?.field === "password"
            }
            className={
              signUpError?.field === "password"
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
        {signUpError?.field === "password" && !errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {signUpError.message}
          </p>
        )}

        {/* Password Strength Indicator */}
        {watchedPassword && passwordStrength && !errors.password && (
          <PasswordStrengthIndicator strength={passwordStrength} />
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !isLoaded}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      {/* Clerk CAPTCHA widget mount point */}
      <div id="clerk-captcha" className="mt-4" />
    </form>
  );
}
