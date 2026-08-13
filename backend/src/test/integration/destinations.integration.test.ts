import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import { destinationsListResponseSchema } from "@travelplan/shared";
import { Country } from "../../features/destinations/models/Country";

const app = createApp();

describe("GET /api/destinations", () => {
  it("returns a payload that validates against the shared response contract", async () => {
    const res = await request(app).get("/api/destinations");
    expect(res.status).toBe(200);

    const parsed = destinationsListResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.countries.length).toBeGreaterThanOrEqual(190);
    }
  });

  it("overlays Mongo insightText onto the matching city by idKey", async () => {
    // Discover a real (country, city) idKey pair from the builder-derived
    // list first — the merge only ever emits cities that already exist in
    // the builder payload, so a fixture city idKey that isn't in there
    // (e.g. a seed-data-dependent city on a checkout with no seed dir)
    // would silently never show up in the response.
    const before = await request(app).get("/api/destinations");
    const vnBefore = before.body.countries.find(
      (c: { idKey: string }) => c.idKey === "vn",
    );
    const targetCity = vnBefore.cities[0];
    expect(targetCity).toBeTruthy();

    await Country.create({
      idKey: "vn",
      name: "Việt Nam",
      nameEn: "Vietnam",
      cities: [
        {
          idKey: targetCity.idKey,
          name: targetCity.name,
          nameEn: targetCity.nameEn,
          timezone: targetCity.timezone,
          insightText: "A real local insight blurb.",
        },
      ],
    });

    const res = await request(app).get("/api/destinations");
    expect(res.status).toBe(200);
    const vn = res.body.countries.find(
      (c: { idKey: string }) => c.idKey === "vn",
    );
    const city = vn?.cities.find(
      (c: { idKey: string }) => c.idKey === targetCity.idKey,
    );
    expect(city?.hasRagInsight).toBe(true);
  });
});
