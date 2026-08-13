import { describe, it, expect, beforeEach } from "vitest";
import {
  useSubscriptionStore,
  subscriptionLimits,
} from "../useSubscriptionStore";

const INITIAL_STATE = useSubscriptionStore.getState();

beforeEach(() => {
  useSubscriptionStore.setState(INITIAL_STATE, true);
});

describe("canCreateTrip", () => {
  it("allows a free user under the trip limit", () => {
    useSubscriptionStore.setState({ isPro: false, tripsUsedThisCycle: 9 });
    expect(useSubscriptionStore.getState().canCreateTrip()).toBe(true);
  });

  it("blocks a free user at the trip limit", () => {
    useSubscriptionStore.setState({ isPro: false, tripsUsedThisCycle: 10 });
    expect(useSubscriptionStore.getState().canCreateTrip()).toBe(false);
  });

  it("blocks a free user over the trip limit", () => {
    useSubscriptionStore.setState({ isPro: false, tripsUsedThisCycle: 11 });
    expect(useSubscriptionStore.getState().canCreateTrip()).toBe(false);
  });

  it("always allows a pro user regardless of tripsUsedThisCycle", () => {
    useSubscriptionStore.setState({ isPro: true, tripsUsedThisCycle: 999 });
    expect(useSubscriptionStore.getState().canCreateTrip()).toBe(true);
  });

  it("uses subscriptionLimits.FREE_TRIP_LIMIT as the default when tripLimit is 0", () => {
    useSubscriptionStore.setState({
      isPro: false,
      tripLimit: 0,
      tripsUsedThisCycle: subscriptionLimits.FREE_TRIP_LIMIT - 1,
    });
    expect(useSubscriptionStore.getState().canCreateTrip()).toBe(true);
  });
});

describe("canUseRegen", () => {
  it("allows a free user under the regen limit for that trip", () => {
    useSubscriptionStore.setState({
      isPro: false,
      regenUsedByTripId: { "trip-1": 4 },
    });
    expect(useSubscriptionStore.getState().canUseRegen("trip-1")).toBe(true);
  });

  it("blocks a free user at the regen limit for that trip", () => {
    useSubscriptionStore.setState({
      isPro: false,
      regenUsedByTripId: { "trip-1": 5 },
    });
    expect(useSubscriptionStore.getState().canUseRegen("trip-1")).toBe(false);
  });

  it("treats an untracked trip as 0 uses so far (allowed)", () => {
    useSubscriptionStore.setState({ isPro: false, regenUsedByTripId: {} });
    expect(useSubscriptionStore.getState().canUseRegen("unknown-trip")).toBe(
      true,
    );
  });

  it("always allows a pro user regardless of regen usage", () => {
    useSubscriptionStore.setState({
      isPro: true,
      regenUsedByTripId: { "trip-1": 999 },
    });
    expect(useSubscriptionStore.getState().canUseRegen("trip-1")).toBe(true);
  });
});

describe("incrementRegenUsage / setRegenUsage", () => {
  it("increments only the target trip's counter, leaving others untouched", () => {
    useSubscriptionStore.setState({
      regenUsedByTripId: { "trip-1": 1, "trip-2": 3 },
    });
    useSubscriptionStore.getState().incrementRegenUsage("trip-1");
    expect(useSubscriptionStore.getState().regenUsedByTripId).toEqual({
      "trip-1": 2,
      "trip-2": 3,
    });
  });

  it("initializes an untracked trip's counter to 1 on first increment", () => {
    useSubscriptionStore.getState().incrementRegenUsage("fresh-trip");
    expect(
      useSubscriptionStore.getState().regenUsedByTripId["fresh-trip"],
    ).toBe(1);
  });

  it("sets an absolute regen usage value", () => {
    useSubscriptionStore.getState().setRegenUsage("trip-1", 3);
    expect(useSubscriptionStore.getState().regenUsedByTripId["trip-1"]).toBe(3);
  });
});

describe("openUpgradeModal / closeUpgradeModal", () => {
  it.each([
    "trip-duration",
    "monthly-trip-limit",
    "regen-limit",
    "advanced-ai-tuning",
    "general-upgrade",
  ] as const)("opens the modal with reason=%s", (reason) => {
    useSubscriptionStore.getState().openUpgradeModal(reason);
    const state = useSubscriptionStore.getState();
    expect(state.isUpgradeModalOpen).toBe(true);
    expect(state.upgradeReason).toBe(reason);
  });

  it("defaults to general-upgrade when no reason is given", () => {
    useSubscriptionStore.getState().openUpgradeModal();
    expect(useSubscriptionStore.getState().upgradeReason).toBe(
      "general-upgrade",
    );
  });

  it("closes the modal without altering the reason", () => {
    useSubscriptionStore.getState().openUpgradeModal("regen-limit");
    useSubscriptionStore.getState().closeUpgradeModal();
    const state = useSubscriptionStore.getState();
    expect(state.isUpgradeModalOpen).toBe(false);
    expect(state.upgradeReason).toBe("regen-limit");
  });
});

describe("setSubscriptionSnapshot", () => {
  it("overwrites isPro/tripsUsedThisCycle/tripLimit/quotaResetsAt", () => {
    useSubscriptionStore.getState().setSubscriptionSnapshot({
      isPro: true,
      tripsUsedThisCycle: 2,
      tripLimit: 30,
      quotaResetsAt: "2026-07-01T00:00:00.000Z",
    });
    const state = useSubscriptionStore.getState();
    expect(state.isPro).toBe(true);
    expect(state.tripsUsedThisCycle).toBe(2);
    expect(state.tripLimit).toBe(30);
    expect(state.quotaResetsAt).toBe("2026-07-01T00:00:00.000Z");
  });
});
