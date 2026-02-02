/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
/**
 * Migration Script: Migrate from relational schema to embedded schema
 *
 * This script migrates:
 * 1. Budget documents → embedded in Trip.budget
 * 2. Itinerary documents → embedded in Trip.itinerary
 * 3. POI documents → Place collection
 * 4. Accommodation documents → Place collection + Trip.cities[].stays[]
 *
 * Run with: npx ts-node scripts/migrate-to-embedded-schema.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import old models
import Budget from "../src/models/Budget";
import Itinerary from "../src/models/Itinerary";
import POI from "../src/models/POI";
import Accommodation from "../src/models/Accommodation";

// Import new models
import Trip from "../src/models/Trip";
import Place from "../src/models/Place";

interface MigrationStats {
  tripsUpdated: number;
  budgetsMigrated: number;
  itinerariesMigrated: number;
  poisMigrated: number;
  accommodationsMigrated: number;
  errors: string[];
}

async function migrate(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    tripsUpdated: 0,
    budgetsMigrated: 0,
    itinerariesMigrated: 0,
    poisMigrated: 0,
    accommodationsMigrated: 0,
    errors: [],
  };

  console.log("🚀 Starting migration to embedded schema...\n");

  // ============================================
  // STEP 1: Migrate POI → Place
  // ============================================
  console.log("📍 Step 1: Migrating POI documents to Place...");

  const pois = await POI.find({});
  for (const poi of pois) {
    try {
      const existingPlace = await Place.findOne({
        source: poi.source,
        sourceId: poi._id.toString(),
      });

      if (!existingPlace) {
        // Build details object, only including defined values
        const details: Record<string, number> = {};
        if (poi.rating !== undefined) details.rating = poi.rating;
        if (poi.averageCost)
          details.priceLevel = Math.ceil(poi.averageCost / 25);

        await Place.create({
          name: poi.name,
          category: mapPoiCategoryToPlaceCategory(poi.category),
          description: poi.description,
          location: poi.location,
          cityId: poi.cityId,
          ...(Object.keys(details).length > 0 && { details }),
          source: poi.source,
          sourceId: poi._id.toString(),
          lastSyncedAt: new Date(),
          isActive: true,
        });
        stats.poisMigrated++;
      }
    } catch (error: any) {
      stats.errors.push(`POI ${poi._id}: ${error.message}`);
    }
  }
  console.log(`   ✅ Migrated ${stats.poisMigrated} POIs\n`);

  // ============================================
  // STEP 2: Migrate Accommodation → Place
  // ============================================
  console.log("🏨 Step 2: Migrating Accommodation documents to Place...");

  const accommodations = await Accommodation.find({});
  const accommodationPlaceMap = new Map<string, string>(); // old ID → new Place ID

  for (const acc of accommodations) {
    try {
      // Check if this accommodation already exists as a Place
      let place = await Place.findOne({
        name: acc.name,
        category: "accommodation",
        "location.coordinates": acc.location.coordinates,
      });

      if (!place) {
        // Build details object, only including defined values
        const accDetails: Record<string, number | string> = {};
        if (acc.rating !== undefined) accDetails.rating = acc.rating;
        if (acc.type) accDetails.accommodationType = acc.type;

        place = await Place.create({
          name: acc.name,
          category: "accommodation",
          location: acc.location,
          cityId: acc.cityId,
          ...(Object.keys(accDetails).length > 0 && { details: accDetails }),
          source: "manual",
          sourceId: acc._id.toString(),
          lastSyncedAt: new Date(),
          isActive: true,
        });
        stats.accommodationsMigrated++;
      }

      accommodationPlaceMap.set(acc._id.toString(), place._id.toString());
    } catch (error: any) {
      stats.errors.push(`Accommodation ${acc._id}: ${error.message}`);
    }
  }
  console.log(
    `   ✅ Migrated ${stats.accommodationsMigrated} Accommodations\n`,
  );

  // ============================================
  // STEP 3: Migrate Budget & Itinerary into Trips
  // ============================================
  console.log("✈️  Step 3: Embedding Budget & Itinerary into Trips...");

  const trips = await Trip.find({});

  for (const trip of trips) {
    try {
      let updated = false;

      // Migrate Budget
      const budget = await Budget.findOne({ tripId: trip._id });
      if (budget && !trip.budget?.totalLimit) {
        trip.budget = {
          currency: trip.currency || "USD",
          totalLimit: budget.totalLimit,
          totalSpent: budget.totalSpent,
          breakdown: budget.categories.map((cat) => ({
            name: cat.name,
            limit: cat.limit,
            spent: cat.spent,
          })),
        };
        stats.budgetsMigrated++;
        updated = true;
      }

      // Migrate Itinerary
      const itineraries = await Itinerary.find({ tripId: trip._id }).sort({
        date: 1,
      });
      if (
        itineraries.length > 0 &&
        (!trip.itinerary || trip.itinerary.length === 0)
      ) {
        trip.itinerary = itineraries.map((it, index) => ({
          day: index + 1,
          date: it.date,
          activities: it.activities.map((act) => ({
            type: act.accommodationId ? "accommodation" : "poi",
            placeId: act.poiId
              ? new mongoose.Types.ObjectId(act.poiId.toString())
              : act.accommodationId
                ? new mongoose.Types.ObjectId(
                    accommodationPlaceMap.get(act.accommodationId.toString()) ||
                      act.accommodationId.toString(),
                  )
                : undefined,
            name: act.title,
            time: act.startTime,
            endTime: act.endTime,
            cost: act.cost,
            status: "planned",
            order: act.order,
          })),
        }));
        stats.itinerariesMigrated += itineraries.length;
        updated = true;
      }

      // Migrate city accommodations to stays
      if (trip.cities) {
        for (const city of trip.cities) {
          const oldAccIds = (city as any).accommodations || [];
          if (
            oldAccIds.length > 0 &&
            (!city.stays || city.stays.length === 0)
          ) {
            city.stays = [];
            for (const accId of oldAccIds) {
              const acc = await Accommodation.findById(accId);
              if (acc) {
                const placeId = accommodationPlaceMap.get(accId.toString());
                city.stays.push({
                  placeId: placeId
                    ? new mongoose.Types.ObjectId(placeId)
                    : undefined,
                  name: acc.name,
                  type: acc.type,
                  checkIn: acc.checkIn || trip.startDate,
                  checkOut: acc.checkOut || trip.endDate,
                  pricePerNight: acc.pricePerNight,
                  totalPrice: acc.pricePerNight * (city.stayNights || 1),
                  status: "confirmed",
                });
              }
            }
            updated = true;
          }
        }
      }

      // Initialize defaults if not set
      if (!trip.budget) {
        trip.budget = {
          currency: "USD",
          totalLimit: trip.totalBudget || 0,
          totalSpent: 0,
          breakdown: [],
        };
        updated = true;
      }

      if (!trip.itinerary) {
        trip.itinerary = [];
        updated = true;
      }

      if (trip.isAgentProcessing === undefined) {
        trip.isAgentProcessing = false;
        updated = true;
      }

      if (!trip.version) {
        trip.version = 1;
        updated = true;
      }

      if (!trip.status) {
        trip.status = "DRAFT";
        updated = true;
      }

      if (updated) {
        await trip.save();
        stats.tripsUpdated++;
      }
    } catch (error: any) {
      stats.errors.push(`Trip ${trip._id}: ${error.message}`);
    }
  }
  console.log(`   ✅ Updated ${stats.tripsUpdated} Trips\n`);

  return stats;
}

function mapPoiCategoryToPlaceCategory(poiCategory: string): string {
  const categoryMap: Record<string, string> = {
    restaurant: "restaurant",
    cafe: "cafe",
    bar: "bar",
    hotel: "accommodation",
    hostel: "accommodation",
    museum: "museum",
    park: "nature",
    landmark: "landmark",
    shopping: "shopping",
    transport: "transport",
    entertainment: "entertainment",
  };

  return categoryMap[poiCategory.toLowerCase()] || "attraction";
}

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/travelplan";
    console.log(`📡 Connecting to MongoDB: ${mongoUri}\n`);

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Run migration
    const stats = await migrate();

    // Print summary
    console.log("=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`   Trips updated:          ${stats.tripsUpdated}`);
    console.log(`   Budgets migrated:       ${stats.budgetsMigrated}`);
    console.log(`   Itineraries migrated:   ${stats.itinerariesMigrated}`);
    console.log(`   POIs → Places:          ${stats.poisMigrated}`);
    console.log(`   Accommodations → Places: ${stats.accommodationsMigrated}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach((err) => console.log(`   - ${err}`));
    } else {
      console.log("\n✅ No errors!");
    }

    console.log("\n🎉 Migration complete!");
    console.log("\n⚠️  NEXT STEPS:");
    console.log("   1. Verify data integrity in MongoDB");
    console.log("   2. Update your controllers to use embedded data");
    console.log(
      "   3. After confirming everything works, you can drop the old collections:",
    );
    console.log("      - db.budgets.drop()");
    console.log("      - db.itineraries.drop()");
    console.log("      - db.pois.drop()");
    console.log("      - db.accommodations.drop()");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
main();
