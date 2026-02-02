import { create } from "zustand";

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: "planning" | "upcoming" | "ongoing" | "completed";
  notes?: string;
}

interface TripsState {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, "id">) => void;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
}

const sampleTrips: Trip[] = [
  {
    id: "1",
    name: "Summer in Paris",
    destination: "Paris, France",
    startDate: "2026-07-15",
    endDate: "2026-07-25",
    budget: 5000,
    spent: 1200,
    status: "planning",
  },
  {
    id: "2",
    name: "Tokyo Adventure",
    destination: "Tokyo, Japan",
    startDate: "2026-09-01",
    endDate: "2026-09-14",
    budget: 8000,
    spent: 0,
    status: "upcoming",
  },
];

export const useTripsStore = create<TripsState>((set) => ({
  trips: sampleTrips,

  addTrip: (trip) => {
    set((state) => ({
      trips: [...state.trips, { ...trip, id: Date.now().toString() }],
    }));
  },

  updateTrip: (id, updates) => {
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === id ? { ...trip, ...updates } : trip
      ),
    }));
  },

  deleteTrip: (id) => {
    set((state) => ({
      trips: state.trips.filter((trip) => trip.id !== id),
    }));
  },
}));
