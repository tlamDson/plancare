/**
 * Auth Feature Types
 *
 * Zod schemas and TypeScript interfaces for authentication
 */

import { z } from "zod";
import { checkPasswordStrength } from "../utils/password";

// Sign Up Form Schema — align with Clerk + block submit before API (avoids 422 after CAPTCHA)
export const signUpFormSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    const s = checkPasswordStrength(data.password);
    if (!s.checks.notCommon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "This password is too common. Choose a longer, more unique password.",
        path: ["password"],
      });
      return;
    }
    if (s.score < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Password is too weak. Use upper & lowercase letters, a number, and a special character.",
        path: ["password"],
      });
    }
  });

export type SignUpFormData = z.infer<typeof signUpFormSchema>;

// Sign In Form Schema
export const signInFormSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type SignInFormData = z.infer<typeof signInFormSchema>;

// Sign Up Error
export interface SignUpError {
  field: "email" | "password" | "general";
  message: string;
}

// Clerk Error Type
export interface ClerkError {
  errors?: Array<{
    message: string;
    code: string;
    longMessage?: string;
    meta?: Record<string, unknown>;
  }>;
}
