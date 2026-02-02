/**
 * Onboarding Constants
 *
 * Static data for onboarding preferences
 */

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
