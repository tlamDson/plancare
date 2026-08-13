import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { checkMongo } from "./mongo.check";

vi.mock("mongoose", () => ({
  default: { createConnection: vi.fn() },
}));

const createConnection = mongoose.createConnection as unknown as ReturnType<
  typeof vi.fn
>;

/** Minimal stand-in for a mongoose Connection, enough for ping + buildInfo + close. */
const fakeConnection = (opts: {
  dbName?: string;
  command?: ReturnType<typeof vi.fn>;
  close?: ReturnType<typeof vi.fn>;
}) => {
  const close = opts.close ?? vi.fn(async () => undefined);
  const command =
    opts.command ?? vi.fn(async () => ({ ok: 1, version: "7.0.14" }));
  return {
    close,
    db: {
      databaseName: opts.dbName ?? "travelplan",
      admin: () => ({ command }),
    },
    __command: command,
    __close: close,
  };
};

const mockConnect = (conn: unknown) => {
  createConnection.mockReturnValue({ asPromise: vi.fn(async () => conn) });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkMongo", () => {
  it("SKIPs when MONGO_URI is absent", async () => {
    const result = await checkMongo({});
    expect(result.status).toBe("SKIP");
    expect(createConnection).not.toHaveBeenCalled();
  });

  it("returns OK with the database name and server version after a successful ping", async () => {
    const conn = fakeConnection({ dbName: "travelplan" });
    mockConnect(conn);

    const result = await checkMongo({
      MONGO_URI: "mongodb+srv://user:pw@cluster/travelplan",
    });

    expect(result.status).toBe("OK");
    expect(result.detail).toContain("travelplan");
    expect(result.detail).toContain("7.0.14");
    expect(conn.__command).toHaveBeenCalledWith({ ping: 1 });
  });

  it("uses a bounded server selection timeout so a dead cluster cannot hang the check", async () => {
    mockConnect(fakeConnection({}));
    await checkMongo({ MONGO_URI: "mongodb://localhost:27017/x" });
    const call = createConnection.mock.calls[0];
    if (!call) throw new Error("expected createConnection to have been called");
    const options = call[1] as { serverSelectionTimeoutMS?: number };
    expect(options.serverSelectionTimeoutMS).toBeLessThanOrEqual(10_000);
  });

  it("closes the connection even when the ping succeeds", async () => {
    const conn = fakeConnection({});
    mockConnect(conn);
    await checkMongo({ MONGO_URI: "mongodb://localhost:27017/x" });
    expect(conn.__close).toHaveBeenCalled();
  });

  it("returns FAIL instead of throwing when the connection is refused", async () => {
    createConnection.mockReturnValue({
      asPromise: vi.fn(async () => {
        throw new Error("connect ECONNREFUSED 127.0.0.1:27017");
      }),
    });

    const result = await checkMongo({
      MONGO_URI: "mongodb://localhost:27017/x",
    });

    expect(result.status).toBe("FAIL");
    expect(result.detail).toContain("ECONNREFUSED");
  });

  it("still reports OK when buildInfo is unavailable but ping works", async () => {
    const command = vi.fn(async (cmd: Record<string, number>) => {
      if (cmd.ping) return { ok: 1 };
      throw new Error("not authorized on admin to execute command");
    });
    mockConnect(fakeConnection({ command }));

    const result = await checkMongo({
      MONGO_URI: "mongodb://localhost:27017/x",
    });

    expect(result.status).toBe("OK");
  });

  it("does not leak credentials from the URI into the reported detail", async () => {
    mockConnect(fakeConnection({}));
    const result = await checkMongo({
      MONGO_URI:
        "mongodb+srv://test-user:placeholder-not-a-secret@cluster0.example.com/travelplan",
    });
    expect(result.detail).not.toContain("placeholder-not-a-secret");
  });
});
