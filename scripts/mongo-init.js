// ============================================
// MongoDB Initialization Script
// Creates database and indexes on first startup
// ============================================

db = db.getSiblingDB("travelplan_db");

// Create collections
db.createCollection("trips");
db.createCollection("places");
db.createCollection("cities");
db.createCollection("users");

print("✅ Collections created");

// Create indexes for Trip collection
db.trips.createIndex({ userId: 1, startDate: -1 });
db.trips.createIndex({ userId: 1, status: 1 });
db.trips.createIndex({ agentJobId: 1 }, { sparse: true });
db.trips.createIndex({ isAgentProcessing: 1 });

print("✅ Trip indexes created");

// Create indexes for Place collection (Geospatial)
db.places.createIndex({ location: "2dsphere" });
db.places.createIndex({ cityId: 1, category: 1 });
db.places.createIndex(
  { source: 1, sourceId: 1 },
  { unique: true, sparse: true },
);
db.places.createIndex({
  name: "text",
  description: "text",
  "details.address": "text",
});
db.places.createIndex({ isStale: 1, lastSyncedAt: 1 });

print("✅ Place indexes created");

// Create indexes for User collection
db.users.createIndex({ clerkId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });

print("✅ User indexes created");

print("🚀 MongoDB initialization complete!");
