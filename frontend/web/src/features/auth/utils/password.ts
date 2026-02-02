/**
 * Password Validation Utilities
 *
 * Client-side password strength checking for instant feedback
 */

// Common weak passwords to check client-side (top 100 breached passwords)
export const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "password1",
  "password123",
  "welcome",
  "welcome1",
  "p@ssw0rd",
  "passw0rd",
  "admin",
  "login",
  "hello",
  "charlie",
  "donald",
  "loveme",
  "soccer",
  "thomas",
  "hockey",
  "ranger",
  "daniel",
  "starwars",
  "klaster",
  "112233",
  "george",
  "computer",
  "michelle",
  "jessica",
  "pepper",
  "1111",
  "zxcvbn",
  "555555",
  "11111111",
  "131313",
  "freedom",
  "777777",
  "pass",
  "maggie",
  "159753",
  "aaaaaa",
  "ginger",
  "princess",
  "joshua",
  "cheese",
  "amanda",
  "summer",
  "love",
  "ashley1",
  "nicole",
  "chelsea",
  "biteme",
  "matthew",
  "access",
  "yankees",
  "987654321",
  "dallas",
  "austin",
  "thunder",
  "taylor",
  "matrix",
  "minecraft",
  "pokemon",
  "letmein1",
  "test",
]);

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=very weak, 4=strong
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    notCommon: boolean;
  };
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
  };

  // Calculate score based on checks
  let score = 0;
  if (checks.minLength) score++;
  if (checks.hasUppercase && checks.hasLowercase) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial) score++;
  if (!checks.notCommon) score = 0; // Common password = instant fail

  const strengthMap: Record<
    number,
    { label: PasswordStrength["label"]; color: string }
  > = {
    0: { label: "Very Weak", color: "bg-destructive" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Good", color: "bg-lime-500" },
    4: { label: "Strong", color: "bg-green-500" },
  };

  return {
    score: score as PasswordStrength["score"],
    ...strengthMap[score],
    checks,
  };
};

/**
 * Mask email for display (j***n@gmail.com)
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  if (localPart.length <= 2) return `${localPart[0]}***@${domain}`;
  return `${localPart[0]}${"*".repeat(Math.min(localPart.length - 2, 3))}${localPart[localPart.length - 1]}@${domain}`;
};
