/**
 * OTP Verification Form Component
 *
 * 6-digit code input with auto-focus, paste support, and resend functionality
 */

import { useRef } from "react";
import { Mail, Check, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { maskEmail } from "../utils/password";

interface OTPVerificationFormProps {
  email: string;
  code: string[];
  error: string;
  isSubmitting: boolean;
  resendCooldown: number;
  onCodeChange: (code: string[]) => void;
  onSubmit: (code?: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
}

export function OTPVerificationForm({
  email,
  code,
  error,
  isSubmitting,
  resendCooldown,
  onCodeChange,
  onSubmit,
  onResend,
  onBack,
}: OTPVerificationFormProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isCodeComplete = code.every((d) => d !== "");

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    onCodeChange(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        onSubmit(fullCode);
      }
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || "";
      }
      onCodeChange(newCode);

      // Focus the next empty input or last input
      const nextEmptyIndex = newCode.findIndex((d) => !d);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Auto-submit if all 6 digits pasted
      if (pastedData.length === 6) {
        onSubmit(pastedData);
      }
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="space-y-4">
          <Label className="sr-only">Verification code</Label>
          <div
            className={`flex justify-center gap-2 sm:gap-3 ${error ? "animate-shake" : ""}`}
            onPaste={handleOtpPaste}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                disabled={isSubmitting}
                className={`
                  w-11 h-14 sm:w-12 sm:h-14 
                  text-center text-xl font-semibold
                  border-2 rounded-lg
                  bg-background
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    error
                      ? "border-destructive focus:ring-destructive"
                      : digit
                        ? "border-primary"
                        : "border-input"
                  }
                `}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive text-center font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Verify Button */}
        <Button
          className="w-full h-11 cursor-pointer"
          onClick={() => onSubmit()}
          disabled={isSubmitting || !isCodeComplete}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Verify Email
            </>
          )}
        </Button>

        {/* Resend Section */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={resendCooldown > 0}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                resendCooldown > 0
                  ? ""
                  : "hover:rotate-180 transition-transform duration-500"
              }`}
            />
            {resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : "Resend code"}
          </Button>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            variant="link"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign up
          </Button>
        </div>
      </div>
    </div>
  );
}
