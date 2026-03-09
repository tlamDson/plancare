import { create } from "zustand";

type UpgradeReason =
  | "trip-duration"
  | "monthly-trip-limit"
  | "regen-limit"
  | "advanced-ai-tuning"
  | "general-upgrade";

interface SubscriptionState {
  isPro: boolean;
  tripsUsedThisCycle: number;
  tripLimit: number;
  quotaResetsAt: string | null;
  regenUsedByTripId: Record<string, number>;
  autoLoadLongTripChunks: boolean;
  isUpgradeModalOpen: boolean;
  upgradeReason: UpgradeReason;
  setSubscriptionSnapshot: (payload: {
    isPro: boolean;
    tripsUsedThisCycle: number;
    tripLimit: number;
    quotaResetsAt: string | null;
  }) => void;
  setAutoLoadLongTripChunks: (enabled: boolean) => void;
  incrementRegenUsage: (tripId: string) => void;
  setRegenUsage: (tripId: string, value: number) => void;
  openUpgradeModal: (reason?: UpgradeReason) => void;
  closeUpgradeModal: () => void;
  canCreateTrip: () => boolean;
  canUseRegen: (tripId: string) => boolean;
}

const FREE_TRIP_LIMIT = 10;
const FREE_REGEN_LIMIT = 5;

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  tripsUsedThisCycle: 0,
  tripLimit: FREE_TRIP_LIMIT,
  quotaResetsAt: null,
  regenUsedByTripId: {},
  autoLoadLongTripChunks: false,
  isUpgradeModalOpen: false,
  upgradeReason: "general-upgrade",
  setSubscriptionSnapshot: (payload) =>
    set({
      isPro: payload.isPro,
      tripsUsedThisCycle: payload.tripsUsedThisCycle,
      tripLimit: payload.tripLimit,
      quotaResetsAt: payload.quotaResetsAt,
    }),
  setAutoLoadLongTripChunks: (enabled) =>
    set({ autoLoadLongTripChunks: enabled }),
  incrementRegenUsage: (tripId) =>
    set((state) => ({
      regenUsedByTripId: {
        ...state.regenUsedByTripId,
        [tripId]: (state.regenUsedByTripId[tripId] ?? 0) + 1,
      },
    })),
  setRegenUsage: (tripId, value) =>
    set((state) => ({
      regenUsedByTripId: { ...state.regenUsedByTripId, [tripId]: value },
    })),
  openUpgradeModal: (reason = "general-upgrade") =>
    set({ isUpgradeModalOpen: true, upgradeReason: reason }),
  closeUpgradeModal: () => set({ isUpgradeModalOpen: false }),
  canCreateTrip: () => {
    const s = get();
    if (s.isPro) return true;
    const limit = s.tripLimit > 0 ? s.tripLimit : FREE_TRIP_LIMIT;
    return s.tripsUsedThisCycle < limit;
  },
  canUseRegen: (tripId) => {
    const s = get();
    if (s.isPro) return true;
    return (s.regenUsedByTripId[tripId] ?? 0) < FREE_REGEN_LIMIT;
  },
}));

export const subscriptionLimits = {
  FREE_TRIP_LIMIT,
  FREE_REGEN_LIMIT,
} as const;

