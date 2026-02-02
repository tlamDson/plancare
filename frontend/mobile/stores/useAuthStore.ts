import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => boolean;
  signUp: (email: string, password: string, name: string) => boolean;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  signIn: (email: string, _password: string) => {
    // Simulate successful sign in
    set({
      user: {
        id: "1",
        email,
        name: email.split("@")[0],
      },
      isAuthenticated: true,
    });
    return true;
  },

  signUp: (email: string, _password: string, name: string) => {
    // Simulate successful sign up
    set({
      user: {
        id: "1",
        email,
        name,
      },
      isAuthenticated: true,
    });
    return true;
  },

  signOut: () => {
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));
