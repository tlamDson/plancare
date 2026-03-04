const mongoose = require("mongoose");
require("dotenv").config();

const TripSchema = new mongoose.Schema({}, { strict: false });
const Trip = mongoose.model("Trip", TripSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const trip = await Trip.findOne().sort({ createdAt: -1 });
  if (!trip) {
    console.log("No trip found");
    process.exit(0);
  }
  const acts = trip.itinerary[0].activities;
  acts.forEach((a) => {
    console.log(`Activity: ${a.name}`);
    console.log(`  - coords:`, a.location?.coordinates);
    console.log(`  - requiresTransport:`, a.requiresTransport);
  });
  process.exit(0);
}
run();
