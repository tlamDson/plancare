export type FocusKey = "Culture" | "Nature" | "Gastronomy" | "Lifestyle";

export type GroupTypeKey =
  | "solo"
  | "couple"
  | "family_kids"
  | "friends"
  | "work";

export type TransportModeKey = "walking" | "public_transport" | "car";

export interface UserPreferences {
  displayName?: string;
  currency: string;
  focus: FocusKey[];
  groupType: GroupTypeKey | null;
  firstTrip: { destination: string; travelers: number } | null;
  onboardingDefaults?: {
    focus: FocusKey[];
    groupType: GroupTypeKey | null;
    transportMode: TransportModeKey;
    pace: "relaxed" | "balanced" | "packed";
    constraints: {
      mobility_friendly: boolean;
      avoid_crowds: boolean;
      foodAsMainActivities: boolean;
    };
    specialRequirements: string;
  };
  transportMode: TransportModeKey;
  pace: "relaxed" | "balanced" | "packed";
  constraints: {
    mobility_friendly: boolean;
    avoid_crowds: boolean;
    foodAsMainActivities: boolean;
  };
  specialRequirements: string;
  seatChoice?: "Aisle" | "Window" | "Middle";
  specialMeals?: string;
  hotelRoom?: "1 Bed" | "2 Beds";
  smoking?: boolean;
  travelMode?: "Transit" | "Driving" | "Walking" | "Cycling";
  avoidTolls?: boolean;
  avoidTraffic?: boolean;
  defaultAirport?: string;
  loyaltyDelta?: string;
  loyaltyUnited?: string;
  loyaltyMarriott?: string;
  loyaltyHertz?: string;
  language?: "English (US)" | "French" | "Vietnamese";
  distance?: "Km" | "Miles";
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  displayName: "",
  currency: "USD",
  focus: [],
  groupType: null,
  firstTrip: null,
  transportMode: "walking",
  pace: "balanced",
  constraints: {
    mobility_friendly: false,
    avoid_crowds: false,
    foodAsMainActivities: false,
  },
  specialRequirements: "",
};

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

const LEGACY_TRAVEL_MODE_TO_TRANSPORT: Record<string, TransportModeKey> = {
  Transit: "public_transport",
  Driving: "car",
  Walking: "walking",
  Cycling: "walking",
};

const GROUP_TO_TRAVEL_STYLE: Record<GroupTypeKey, string> = {
  solo: "solo",
  couple: "couple",
  family_kids: "family",
  friends: "friends",
  work: "friends",
};

const FOCUS_TO_INTEREST: Record<FocusKey, string> = {
  Culture: "culture",
  Nature: "nature",
  Gastronomy: "food",
  Lifestyle: "city",
};

export function mapInterestsToFocus(interests: string[] = []): FocusKey[] {
  const set = new Set<FocusKey>();
  for (const id of interests) {
    const focus = INTEREST_TO_FOCUS[id];
    if (focus) set.add(focus);
  }
  return [...set];
}

export function mapFocusToInterests(focus: FocusKey[] = []): string[] {
  const set = new Set<string>();
  for (const item of focus) {
    const interest = FOCUS_TO_INTEREST[item];
    if (interest) set.add(interest);
  }
  return [...set];
}

export function mapGroupToTravelStyle(groupType: GroupTypeKey | null): string {
  if (!groupType) return "";
  return GROUP_TO_TRAVEL_STYLE[groupType] ?? "";
}

export function migrateUserPreferences(raw: any): UserPreferences {
  const focus = Array.isArray(raw?.focus)
    ? (raw.focus.filter((x: unknown) => typeof x === "string") as FocusKey[])
    : mapInterestsToFocus(raw?.interests ?? []);

  const groupType =
    typeof raw?.groupType === "string"
      ? (raw.groupType as GroupTypeKey)
      : raw?.travelStyle
        ? TRAVEL_STYLE_TO_GROUP[raw.travelStyle] ?? null
        : null;

  const transportMode =
    raw?.transportMode ??
    LEGACY_TRAVEL_MODE_TO_TRANSPORT[raw?.travelMode as string] ??
    DEFAULT_USER_PREFERENCES.transportMode;

  return {
    ...DEFAULT_USER_PREFERENCES,
    ...raw,
    focus,
    groupType,
    transportMode,
    pace: raw?.pace ?? DEFAULT_USER_PREFERENCES.pace,
    constraints: {
      ...DEFAULT_USER_PREFERENCES.constraints,
      ...(raw?.constraints ?? {}),
      mobility_friendly:
        raw?.constraints?.mobility_friendly ??
        raw?.accessible ??
        DEFAULT_USER_PREFERENCES.constraints.mobility_friendly,
    },
    specialRequirements:
      raw?.specialRequirements ?? raw?.specialMeals ?? DEFAULT_USER_PREFERENCES.specialRequirements,
    firstTrip: raw?.firstTrip ?? DEFAULT_USER_PREFERENCES.firstTrip,
    onboardingDefaults: raw?.onboardingDefaults ?? {
      focus,
      groupType,
      transportMode: DEFAULT_USER_PREFERENCES.transportMode,
      pace: DEFAULT_USER_PREFERENCES.pace,
      constraints: { ...DEFAULT_USER_PREFERENCES.constraints },
      specialRequirements: DEFAULT_USER_PREFERENCES.specialRequirements,
    },
  };
}

export function getUserPreferences(): UserPreferences {
  try {
    const raw = JSON.parse(localStorage.getItem("user-preferences") || "{}");
    const migrated = migrateUserPreferences(raw);
    localStorage.setItem("user-preferences", JSON.stringify(migrated));
    return migrated;
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export function saveUserPreferences(partial: Partial<UserPreferences>) {
  const current = getUserPreferences();
  const merged = migrateUserPreferences({ ...current, ...partial });
  localStorage.setItem("user-preferences", JSON.stringify(merged));
  return merged;
}
