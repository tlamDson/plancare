import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import axios from "axios";
import { createApp } from "../../app";
import { asUser, seedUser } from "../integration-fixtures";
import User from "../../features/user/models/User";

// getUserMe() falls back to a real `axios.get("https://api.clerk.com/...")`
// when the user isn't in Mongo yet — without this mock the suite would make
// a live outbound HTTPS call on every "missing user" test and flake in CI.
vi.mock("axios");

const app = createApp();
const mockedAxiosGet = vi.mocked(axios.get);

beforeEach(() => {
  mockedAxiosGet.mockReset();
});

describe("GET /api/users/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("returns the user with quota usage when already in Mongo", async () => {
    await seedUser("user-me-1");
    const res = await request(app)
      .get("/api/users/me")
      .set(asUser("user-me-1"));

    expect(res.status).toBe(200);
    expect(res.body.usage.tripLimit).toBe(10);
    expect(res.body.usage.tripsUsedThisCycle).toBe(0);
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is missing locally and the Clerk API sync fails", async () => {
    mockedAxiosGet.mockRejectedValueOnce(new Error("network error"));
    const res = await request(app)
      .get("/api/users/me")
      .set(asUser("user-me-missing"));

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/could not be synced/);
  });

  it("creates a User from the Clerk API fallback when missing locally", async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      data: {
        email_addresses: [
          { id: "eml_1", email_address: "synced@example.test" },
        ],
        primary_email_address_id: "eml_1",
        image_url: "https://example.test/a.png",
        first_name: "Synced",
        last_name: "User",
      },
    });

    const res = await request(app)
      .get("/api/users/me")
      .set(asUser("user-me-synced"));

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("synced@example.test");

    const persisted = await User.findOne({ clerkUserId: "user-me-synced" });
    expect(persisted).not.toBeNull();
  });
});

describe("PATCH /api/users/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch("/api/users/me").send({});
    expect(res.status).toBe(401);
  });

  it("returns 400 on a schema violation", async () => {
    await seedUser("user-patch-1");
    const res = await request(app)
      .patch("/api/users/me")
      .set(asUser("user-patch-1"))
      .send({ dateOfBirth: "not-a-date" });
    expect(res.status).toBe(400);
  });

  it("applies a valid partial update", async () => {
    await seedUser("user-patch-2");
    const res = await request(app)
      .patch("/api/users/me")
      .set(asUser("user-patch-2"))
      .send({ firstName: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("Updated");
  });

  it("does not let a free user self-upgrade via mass assignment (tier is not in the schema)", async () => {
    await seedUser("user-patch-3", { tier: "free" });
    const res = await request(app)
      .patch("/api/users/me")
      .set(asUser("user-patch-3"))
      .send({ tier: "pro" });
    expect(res.status).toBe(200);

    const persisted = await User.findOne({ clerkUserId: "user-patch-3" });
    expect(persisted?.tier).toBe("free");
  });
});
