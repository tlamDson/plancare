/**
 * AI Text Sanitization Utility
 *
 * Section 4.1: AI Sanitization
 * RULE: NEVER render AI text directly
 * Pattern: Raw AI Text → DOMPurify.sanitize() → ReactMarkdown → DOM
 *
 * Prohibition: dangerouslySetInnerHTML is FORBIDDEN unless wrapped here
 */

import DOMPurify, { type Config } from "dompurify";

// ============================================
// SANITIZATION CONFIGURATION
// ============================================

/**
 * DOMPurify configuration for AI-generated content
 * Strict mode: Only allow safe tags and attributes
 */
const SANITIZE_CONFIG: Config = {
  // Allowed tags (Markdown essentials)
  ALLOWED_TAGS: [
    // Text formatting
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "del",
    "ins",
    "mark",
    "small",
    "sub",
    "sup",
    // Headings
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    // Lists
    "ul",
    "ol",
    "li",
    // Links (with restrictions)
    "a",
    // Code
    "code",
    "pre",
    // Block elements
    "blockquote",
    "hr",
    "div",
    "span",
    // Tables
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    // Images (optional - enable if needed)
    // "img",
  ],

  // Allowed attributes
  ALLOWED_ATTR: [
    "href",
    "title",
    "target",
    "rel",
    "class",
    "id",
    // Data attributes for styling
    "data-*",
  ],

  // Force all links to open in new tab with security
  ADD_ATTR: ["target", "rel"],

  // Forbidden tags (always strip)
  FORBID_TAGS: [
    "script",
    "style",
    "iframe",
    "form",
    "input",
    "object",
    "embed",
  ],

  // Forbidden attributes
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],

  // Return string, not DOM
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Sanitize AI-generated text for safe rendering
 *
 * @param dirty - Raw AI text (potentially unsafe)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * // In your component:
 * import { sanitizeAIText } from '@/utils/sanitize';
 * import ReactMarkdown from 'react-markdown';
 *
 * <ReactMarkdown>{sanitizeAIText(aiResponse)}</ReactMarkdown>
 */
export function sanitizeAIText(dirty: string): string {
  if (!dirty || typeof dirty !== "string") {
    return "";
  }

  // First pass: Remove any script-like patterns
  let cleaned = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");

  // Second pass: DOMPurify sanitization
  cleaned = DOMPurify.sanitize(cleaned, SANITIZE_CONFIG) as string;

  // Post-process: Ensure links have proper security attributes
  cleaned = cleaned.replace(
    /<a\s+href=/g,
    '<a target="_blank" rel="noopener noreferrer" href=',
  );

  return cleaned;
}

/**
 * Sanitize HTML for direct insertion (use sparingly!)
 *
 * WARNING: Only use this with the provided SafeHTML component
 * NEVER use dangerouslySetInnerHTML directly
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ...SANITIZE_CONFIG,
    // Even stricter for direct HTML
    ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "ul", "ol", "li"],
  }) as string;
}

/**
 * Strip ALL HTML tags - return plain text only
 * Use when you need text without any formatting
 */
export function stripHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Check if text contains potentially dangerous content
 * Use for validation before processing
 */
export function containsDangerousContent(text: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:/i,
    /vbscript:/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(text));
}

// ============================================
// REACT COMPONENT FOR SAFE HTML
// ============================================

/**
 * Use this instead of dangerouslySetInnerHTML
 *
 * @example
 * import { SafeHTML } from '@/utils/sanitize';
 * <SafeHTML html={aiGeneratedContent} />
 */
export function createSafeHTML(html: string): { __html: string } {
  return { __html: sanitizeHTML(html) };
}
