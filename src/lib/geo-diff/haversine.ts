import { GeoCoordinates } from "@models/geo";

const EARTH_RADIUS_IN_KM = 6371;

export function getHaversineDistance(
  previousCoordinates: GeoCoordinates,
  coordinates: GeoCoordinates,
): number {
  const [userLongitude, userLatitude] = previousCoordinates;
  const [targetLongitude, targetLatitude] = coordinates;
  const toRadians = (deg: number) => deg * (Math.PI / 180);
  const latitudeDifference = toRadians(targetLatitude - userLatitude);
  const longitudeDifference = toRadians(targetLongitude - userLongitude);
  const sphereScore =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(toRadians(userLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);
  const arcTangeant =
    2 * Math.atan2(Math.sqrt(sphereScore), Math.sqrt(1 - sphereScore));
  return EARTH_RADIUS_IN_KM * arcTangeant;
}
