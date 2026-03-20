/**
 * Onboarding Constants
 *
 * Static data for onboarding preferences
 */

import type { FocusKey, GroupTypeKey } from "@/features/settings/types/user-preferences.types";

export const INTERESTS = [
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "culture", label: "Culture", emoji: "🏛️" },
  { id: "food", label: "Food & Cuisine", emoji: "🍜" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "beach", label: "Beach", emoji: "🏖️" },
  { id: "city", label: "City Life", emoji: "🌆" },
  { id: "history", label: "History", emoji: "📜" },
  { id: "nightlife", label: "Nightlife", emoji: "🎉" },
];

export const TRAVEL_STYLES = [
  { id: "solo", label: "Solo Traveler", description: "Exploring on your own" },
  { id: "couple", label: "Couple", description: "Romantic getaways" },
  { id: "family", label: "Family", description: "Trips with kids" },
  { id: "friends", label: "Friends", description: "Group adventures" },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

export interface OnboardingPreferences {
  currency: string;
  interests: string[];
  travelStyle: string;
  firstTrip: { destination: string; travelers: number } | null;
}

export const INTEREST_TO_FOCUS: Record<string, FocusKey> = {
  food: "Gastronomy",
  culture: "Culture",
  history: "Culture",
  nature: "Nature",
  beach: "Nature",
  adventure: "Nature",
  city: "Lifestyle",
  nightlife: "Lifestyle",
};

export const TRAVEL_STYLE_TO_GROUP: Record<string, GroupTypeKey> = {
  solo: "solo",
  couple: "couple",
  family: "family_kids",
  friends: "friends",
};

export function mapInterestsToFocus(interests: string[]): FocusKey[] {
  const set = new Set<FocusKey>();
  for (const id of interests) {
    const focus = INTEREST_TO_FOCUS[id];
    if (focus) set.add(focus);
  }
  return [...set];
}
