/**
 * Axios Instance Configuration
 *
 * Section 4.2: Secrets Management
 * - Uses import.meta.env (NOT process.env)
 * - Frontend only talks to TravelPlan Backend
 */

import axios, { AxiosError, type AxiosResponse } from "axios";

// ============================================
// ENVIRONMENT CONFIGURATION
// Section 4.2: Use import.meta.env ONLY
// ============================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// ============================================
// AXIOS INSTANCE
// ============================================

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies for auth
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // Auth token is handled via httpOnly cookies (more secure)
    // Or if using Bearer token:
    // const token = getAuthToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors globally
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          // Don't redirect if already on auth pages
          if (!window.location.pathname.includes("/sign")) {
            window.location.href = "/signin";
          }
          break;
        case 403:
          // Forbidden
          console.error("Access denied");
          break;
        case 429:
          // Rate limited
          console.error("Too many requests. Please slow down.");
          break;
        case 500:
        case 502:
        case 503:
          // Server errors
          console.error("Server error. Please try again later.");
          break;
      }
    } else if (error.request) {
      // Network error
      console.error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  },
);

// ============================================
// TYPED API HELPERS
// ============================================

export type ApiResponse<T> = {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

export type ApiError = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
};
