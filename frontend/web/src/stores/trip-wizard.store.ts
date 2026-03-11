import { create } from "zustand";
import { convertCurrency } from "@/utils/format";

export type TripWizardPriorities = {
  money: number;
  comfort: number;
  unique: number;
};

export type TripWizardData = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: {
    adults: number;
    children: number;
  };
  budget: {
    total: number;
    currency: string;
  };
  priorities: TripWizardPriorities;
  accommodationType: "hotel" | "hostel" | "airbnb" | "resort" | "any" | "";
  accommodationFlexible: boolean;
  // ─── New Step 5 fields ────────────────────────────────────────────────
  pace: "relaxed" | "balanced" | "packed";
  focus: ("Culture" | "Nature" | "Gastronomy" | "Lifestyle")[];
  constraints: {
    mobility_friendly: boolean;
    avoid_crowds: boolean;
    start_late: boolean;
    indoor_only: boolean;
    no_street_food: boolean;
    no_late_nights: boolean;
  };
  specialRequirements: string;
  // ─── Deprecated (kept for backward compat) ────────────────────────────
  mood:
    | ""
    | "city_break"
    | "beach"
    | "hiking"
    | "foodie"
    | "romantic"
    | "adventure";
  interests: string[];
  dealBreakers: string[];
  purpose?: "leisure" | "business" | "bleisure" | "family_visit" | "event";
  groupType?: "solo" | "couple" | "family_kids" | "friends" | "work";
  transportMode: "walking" | "public_transport" | "car";
  activitiesPerDay: number;
  // ─── Destination idKeys for RAG lookup ───────────────────────────────────
  countryIdKey?: string;
  cityIdKey?: string;
};

const initialData: TripWizardData = {
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  travelers: { adults: 1, children: 0 },
  budget: { total: 500, currency: "USD" },
  priorities: { money: 5, comfort: 5, unique: 5 },
  accommodationType: "",
  accommodationFlexible: true,
  pace: "balanced",
  focus: [],
  constraints: {
    mobility_friendly: false,
    avoid_crowds: false,
    start_late: false,
    indoor_only: false,
    no_street_food: false,
    no_late_nights: false,
  },
  specialRequirements: "",
  mood: "",
  interests: [],
  dealBreakers: [],
  purpose: undefined,
  groupType: undefined,
  transportMode: "walking",
  activitiesPerDay: 3,
  countryIdKey: undefined,
  cityIdKey: undefined,
};

type TripWizardState = {
  data: TripWizardData;
  setData: (partial: Partial<TripWizardData>) => void;
  setTravelers: (travelers: TripWizardData["travelers"]) => void;
  setBudget: (budget: TripWizardData["budget"]) => void;
  setPriorities: (priorities: TripWizardPriorities) => void;
  /** Call this when opening the wizard to inject user's preferred currency */
  initWizard: (currency: string) => void;
  reset: () => void;
};

export const useTripWizardStore = create<TripWizardState>((set) => ({
  data: initialData,
  setData: (partial) =>
    set((state) => ({
      data: { ...state.data, ...partial },
    })),
  setTravelers: (travelers) =>
    set((state) => ({
      data: { ...state.data, travelers },
    })),
  setBudget: (budget) =>
    set((state) => ({
      data: { ...state.data, budget },
    })),
  setPriorities: (priorities) =>
    set((state) => ({
      data: { ...state.data, priorities },
    })),
  initWizard: (currency) =>
    set((state) => ({
      data: {
        ...state.data,
        budget: {
          // Convert the 500 USD base default into the user's preferred currency
          total: Math.round(convertCurrency(500, "USD", currency)),
          currency,
        },
      },
    })),
  reset: () => set({ data: initialData }),
}));
