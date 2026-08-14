import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { renderHookWithQuery } from "@/test/renderHookWithQuery";
import { useTripCalendarSync } from "../useTripCalendarSync";

const reauthorize = vi.fn().mockResolvedValue(undefined);
const reload = vi.fn().mockResolvedValue(undefined);

const mockUser = {
  primaryEmailAddress: { emailAddress: "vip@example.com" },
  externalAccounts: [{ provider: "google", reauthorize }],
  reload,
};

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ user: mockUser, isLoaded: true }),
}));

vi.mock("@/lib/vip-check", () => ({
  isVipUser: () => true,
}));

vi.mock("../../api/calendar.api", () => ({
  syncTripToCalendar: vi.fn().mockResolvedValue({ message: "ok" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("useTripCalendarSync — Google account matching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("finds the linked Google account via Clerk's current provider value ('google', not 'oauth_google')", async () => {
    // Clerk's OAuthProvider dropped the "oauth_" prefix — externalAccounts
    // now report provider: "google". Comparing against the stale
    // "oauth_google" string meant this account was never found and the
    // "link your Google account" error fired for every user, including
    // ones who signed in with Google.
    const { result } = renderHookWithQuery(() => useTripCalendarSync("trip-1"));

    await act(async () => {
      await result.current.handleSync();
    });

    expect(reauthorize).toHaveBeenCalledTimes(1);
    expect(reauthorize).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalScopes: [expect.stringContaining("calendar.events")],
      }),
    );
  });

  it("does not find an account whose provider is the stale 'oauth_google' value", async () => {
    const staleReauthorize = vi.fn().mockResolvedValue(undefined);
    mockUser.externalAccounts = [
      { provider: "oauth_google", reauthorize: staleReauthorize },
    ];

    const { result } = renderHookWithQuery(() => useTripCalendarSync("trip-1"));

    await act(async () => {
      await result.current.handleSync();
    });

    expect(staleReauthorize).not.toHaveBeenCalled();

    // restore for other tests in this file
    mockUser.externalAccounts = [{ provider: "google", reauthorize }];
  });
});
