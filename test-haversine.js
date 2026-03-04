function toRad(deg) {
  return (deg * Math.PI) / 180;
}
function haversineKm(a, b) {
  const R = 6371;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const haversine =
    sinDLat * sinDLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;
  return R * 2 * Math.asin(Math.sqrt(haversine));
}

// Top of the Rock
const a = [-73.9793, 40.7593];
// Manhattan Kayak Co (approx)
const b = [-74.001, 40.763];

console.log("Distance:", haversineKm(a, b));
