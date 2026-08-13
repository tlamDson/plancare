import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { createTripFromWizard } from "../trip-wizard.api";
import type { TripPreferences } from "@travelplan/shared";

const validPreferences: TripPreferences = {
  destination: "Da Nang, Vietnam",
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-03T00:00:00.000Z",
  budget: { total: 500, currency: "USD" },
  travelers: { adults: 1, children: 0 },
  pace: "balanced",
  focus: [],
  constraints: {
    mobility_friendly: false,
    avoid_crowds: false,
    start_late: false,
    indoor_only: false,
    no_street_food: false,
    no_late_nights: false,
    foodAsMainActivities: false,
  },
  includedMeals: [],
  transportMode: "walking",
  activitiesPerDay: 3,
  accommodationType: "any",
};

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("createTripFromWizard", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("throws before making a network call when preferences are invalid", async () => {
    let called = false;
    server.use(
      http.post("*/trips", () => {
        called = true;
        return HttpResponse.json({ success: true, jobId: "j", tripId: "t" });
      }),
    );

    await expect(
      createTripFromWizard({
        ...validPreferences,
        destination: "D", // fails min(2)
      }),
    ).rejects.toThrow("Trip preferences are invalid");
    expect(called).toBe(false);
  });

  it("sends an X-Idempotency-Key header shaped like a UUID v4", async () => {
    let capturedHeader: string | null = null;
    server.use(
      http.post("*/trips", ({ request }) => {
        capturedHeader = request.headers.get("x-idempotency-key");
        return HttpResponse.json({
          success: true,
          jobId: "job-1",
          tripId: "trip-1",
        });
      }),
    );

    await createTripFromWizard(validPreferences);
    expect(capturedHeader).toMatch(UUID_V4);
  });

  it("returns the parsed success response", async () => {
    server.use(
      http.post("*/trips", () =>
        HttpResponse.json({
          success: true,
          jobId: "job-1",
          tripId: "trip-1",
          tier: "free",
        }),
      ),
    );
    const result = await createTripFromWizard(validPreferences);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        jobId: "job-1",
        tripId: "trip-1",
        tier: "free",
      }),
    );
  });

  it("throws the server's message when the API returns success: false", async () => {
    server.use(
      http.post("*/trips", () =>
        HttpResponse.json({
          success: false,
          message: "Budget is too low",
        }),
      ),
    );
    await expect(createTripFromWizard(validPreferences)).rejects.toThrow(
      "Budget is too low",
    );
  });

  it("throws when the response matches neither the success nor the error shape", async () => {
    server.use(
      http.post("*/trips", () => HttpResponse.json({ unexpected: "shape" })),
    );
    await expect(createTripFromWizard(validPreferences)).rejects.toThrow();
  });
});
