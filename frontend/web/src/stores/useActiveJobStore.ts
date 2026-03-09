import { create } from "zustand";

interface ActiveJobState {
  activeJobId: string | null;
  tripId: string | null;
  setActiveJob: (jobId: string, tripId: string) => void;
  clearActiveJob: () => void;
}

export const useActiveJobStore = create<ActiveJobState>((set) => ({
  activeJobId: null,
  tripId: null,
  setActiveJob: (jobId: string, tripId: string) =>
    set({ activeJobId: jobId, tripId }),
  clearActiveJob: () => set({ activeJobId: null, tripId: null }),
}));
