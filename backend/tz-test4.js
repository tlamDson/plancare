const { formatInTimeZone, fromZonedTime } = require("date-fns-tz");

const y = 2026,
  m = 2,
  d = 10,
  startHour = 23,
  startMin = 0;
const endHour = startHour + 2; // 25
const endMin = 0;

const startWall = new Date(Date.UTC(y, m, d, startHour, startMin, 0));
const endWall = new Date(Date.UTC(y, m, d, endHour, endMin, 0));

const startLocalStr = `${startWall.getUTCFullYear()}-${String(startWall.getUTCMonth() + 1).padStart(2, "0")}-${String(startWall.getUTCDate()).padStart(2, "0")}T${String(startWall.getUTCHours()).padStart(2, "0")}:${String(startWall.getUTCMinutes()).padStart(2, "0")}:00`;

const endLocalStr = `${endWall.getUTCFullYear()}-${String(endWall.getUTCMonth() + 1).padStart(2, "0")}-${String(endWall.getUTCDate()).padStart(2, "0")}T${String(endWall.getUTCHours()).padStart(2, "0")}:${String(endWall.getUTCMinutes()).padStart(2, "0")}:00`;

const tz = "Asia/Ho_Chi_Minh";
const startUtc = fromZonedTime(startLocalStr, tz);
const endUtc = fromZonedTime(endLocalStr, tz);

console.log("startLocalStr:", startLocalStr);
console.log("endLocalStr:", endLocalStr);
console.log(
  "start API payload:",
  formatInTimeZone(startUtc, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
);
console.log(
  "end API payload:",
  formatInTimeZone(endUtc, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
);
