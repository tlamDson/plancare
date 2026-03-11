const { formatInTimeZone, fromZonedTime } = require("date-fns-tz");

const tz = "America/New_York";
const dateStr = "2026-03-10T09:00:00"; // Local time in NY

// Test parsing string
try {
  const utcDate = fromZonedTime(dateStr, tz);
  console.log(
    "Parsed from string: ",
    formatInTimeZone(utcDate, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  );
} catch (e) {
  console.log("String parse error", e.message);
}
