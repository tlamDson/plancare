import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app";

const app = createApp();

describe("CORS preflight", () => {
  it("allows a known local dev origin with the x-idempotency-key header", async () => {
    const res = await request(app)
      .options("/api/trips")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "x-idempotency-key,content-type");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(res.headers["access-control-allow-headers"]).toContain(
      "x-idempotency-key",
    );
  });

  it("does not echo an unrecognized origin", async () => {
    const res = await request(app)
      .options("/api/trips")
      .set("Origin", "https://not-allowed.example.com")
      .set("Access-Control-Request-Method", "POST");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
