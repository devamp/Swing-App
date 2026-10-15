type Coordinate = { latitude: number; longitude: number };

export function distanceMiles(a: Coordinate, b: Coordinate) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 7917.6 * Math.asin(Math.sqrt(Math.min(1, h)));
}
