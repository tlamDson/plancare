const { formatInTimeZone, fromZonedTime } = require("date-fns-tz");
const tz = "Asia/Ho_Chi_Minh";

[9, 14, 19].forEach((h) => {
  const l = new Date(2026, 2, 10, h, 0, 0); // local time system default
  const utc = fromZonedTime(l, tz);
  console.log("Input: ", l.toISOString());
  console.log(
    "Offset output: ",
    formatInTimeZone(utc, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
  );
  console.log(
    "No offset output: ",
    formatInTimeZone(utc, tz, "yyyy-MM-dd'T'HH:mm:ss"),
  );
});
