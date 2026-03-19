/**
 * Test script for RAG implementation
 * Usage: npx ts-node src/test-rag.ts
 */

import mongoose from "mongoose";
import { env } from "./config/env";
import { PlaceInsight } from "./features/destinations/models/PlaceInsight";
import { getRelevantPlaceInsights } from "./features/destinations/services/place-insight-retrieval.service";
import { embedText } from "./features/destinations/services/embedding.service";
import { logger } from "./lib/logger";

async function testRAG() {
  try {
    // 1. Connect to MongoDB
    logger.info("🔌 Connecting to MongoDB...");
    await mongoose.connect(env.MONGO_URI);
    logger.info("✅ Connected to MongoDB");

    // 2. Check PlaceInsight collection stats
    const totalCount = await PlaceInsight.countDocuments();
    logger.info({ totalCount }, "📊 Total PlaceInsight documents");

    // Sample by city
    const citySample = await PlaceInsight.aggregate([
      { $group: { _id: "$cityIdKey", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    logger.info({ citySample }, "🏙️ Top 10 cities by document count");

    // Sample categories
    const categorySample = await PlaceInsight.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    logger.info({ categorySample }, "📊 Documents by category");

    // 3. Test embedding service
    logger.info("🧪 Testing embedding service...");
    const testText = "Tokyo best ramen restaurants";
    const embedding = await embedText(testText);
    logger.info(
      { 
        textLength: testText.length, 
        embeddingDims: embedding.length,
        firstFewValues: embedding.slice(0, 5)
      }, 
      "✅ Embedding generated"
    );

    // 4. Test vector search with different destinations
    const testCases = [
      {
        destination: "Tokyo, Japan",
        preferences: {
          destination: "Tokyo, Japan",
          startDate: "2024-06-01",
          endDate: "2024-06-05",
          budget: 2000,
          travelers: 2,
          focus: ["Gastronomy", "Culture"],
          pace: "moderate"
        }
      },
      {
        destination: "Paris, France",
        preferences: {
          destination: "Paris, France",
          startDate: "2024-07-01",
          endDate: "2024-07-07",
          budget: 3000,
          travelers: 2,
          focus: ["Culture", "Lifestyle"],
          pace: "relaxed"
        }
      },
      {
        destination: "Hanoi, Vietnam",
        preferences: {
          destination: "Hanoi, Vietnam",
          startDate: "2024-08-01",
          endDate: "2024-08-04",
          budget: 800,
          travelers: 2,
          focus: ["Gastronomy", "Nature"],
          pace: "moderate",
          constraints: {
            foodAsMainActivities: true
          }
        }
      }
    ];

    for (const testCase of testCases) {
      logger.info({ destination: testCase.destination }, "🧪 Testing vector search...");
      
      const results = await getRelevantPlaceInsights(
        testCase.destination,
        {},
        testCase.preferences as any
      );

      logger.info(
        {
          destination: testCase.destination,
          resultsLength: results.length,
          linesCount: results.split('\n').length,
          preview: results.substring(0, 300) + '...'
        },
        "📍 Vector search results"
      );

      console.log("\n" + "=".repeat(80));
      console.log(`🌍 ${testCase.destination}`);
      console.log("=".repeat(80));
      console.log(results);
      console.log("\n");
    }

    // 5. Test specific cityIdKey query with raw vector search
    logger.info("🧪 Testing raw MongoDB vector search...");
    const sampleCity = citySample[0];
    if (sampleCity) {
      const cityIdKey = sampleCity._id;
      const testQuery = "best food restaurants local cuisine";
      const queryVector = await embedText(testQuery);

      const rawResults = await PlaceInsight.aggregate([
        {
          $vectorSearch: {
            index: "placeinsights_vector_index",
            path: "embedding",
            queryVector,
            numCandidates: 100,
            limit: 10,
            filter: { cityIdKey }
          }
        },
        {
          $project: {
            name: 1,
            category: 1,
            description: 1,
            tags: 1,
            cityIdKey: 1,
            score: { $meta: "vectorSearchScore" },
            _id: 0
          }
        }
      ]);

      logger.info(
        {
          cityIdKey,
          query: testQuery,
          resultsCount: rawResults.length,
          avgScore: rawResults.length > 0
            ? (rawResults.reduce((sum, r) => sum + (r.score || 0), 0) / rawResults.length).toFixed(4)
            : 0
        },
        "📊 Raw vector search stats"
      );

      console.log("\n" + "=".repeat(80));
      console.log(`🔍 Raw Query for cityIdKey: ${cityIdKey}`);
      console.log("=".repeat(80));
      rawResults.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name} (${r.category}) - Score: ${r.score?.toFixed(4)}`);
        console.log(`   ${r.description}`);
        console.log(`   Tags: ${r.tags.join(", ")}`);
        console.log();
      });
    }

    logger.info("✅ RAG test completed successfully");

  } catch (error) {
    logger.error(
      { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      "❌ RAG test failed"
    );
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info("🔌 Disconnected from MongoDB");
  }
}

// Run the test
testRAG()
  .then(() => {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
