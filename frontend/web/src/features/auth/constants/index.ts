/**
 * Auth Constants
 *
 * Static values and error message mappings
 */

// Resend cooldown in seconds
export const RESEND_COOLDOWN = 60;

// Sign up page benefits list
export const SIGN_UP_BENEFITS = [
  "AI-powered itinerary generation",
  "Real-time budget tracking",
  "Interactive maps with route planning",
  "Export and share your plans",
];

// Map Clerk error codes to user-friendly messages
export const getErrorMessage = (
  code: string,
  defaultMessage: string,
): string => {
  const errorMessages: Record<string, string> = {
    form_password_pwned:
      "Password is too weak. Please choose a stronger password.",
    form_password_length_too_short: "Password must be at least 8 characters.",
    form_password_no_uppercase:
      "Password must contain at least one uppercase letter.",
    form_password_no_lowercase:
      "Password must contain at least one lowercase letter.",
    form_password_no_number: "Password must contain at least one number.",
    form_identifier_exists:
      "An account with this email already exists. Try signing in instead.",
    form_param_format_invalid: "Please enter a valid email address.",
    form_param_nil: "Please fill in all required fields.",
  };
  return errorMessages[code] || defaultMessage;
};

// Determine which field the error relates to
export const getErrorField = (
  code: string,
): "email" | "password" | "general" => {
  if (code.includes("password")) return "password";
  if (code.includes("identifier") || code.includes("email")) return "email";
  return "general";
};
