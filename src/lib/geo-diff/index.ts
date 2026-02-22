import {
  DEFAULT_GEODIFF_OPTIONS,
  GeoCoordinates,
  GeoDiff,
  GeoDiffOptions,
  GeoDirection,
  GeoStatus,
  GeoUnit,
} from "@models/geo";
import { getHaversineDistance } from "./haversine";
import { getVincentyDistance } from "./vincenty";

function getDistanceLabel(distance: number, options: GeoDiffOptions): string {
  return new Intl.NumberFormat(
    options?.locale || DEFAULT_GEODIFF_OPTIONS.locale,
    {
      style: "unit",
      unit: options?.unit || "kilometer",
      unitDisplay: "long",
      maximumFractionDigits: options?.maxDecimals || 2,
    },
  ).format(distance);
}

function areValidCoordinates(
  coordinates: GeoCoordinates | null | undefined,
): coordinates is GeoCoordinates {
  if (Array.isArray(coordinates)) {
    return (
      coordinates.length === 2 &&
      typeof coordinates[0] === "number" &&
      !isNaN(coordinates[0]) &&
      typeof coordinates[1] === "number" &&
      !isNaN(coordinates[1])
    );
  }
  return false;
}

function getGeoDirection(
  previous: GeoCoordinates,
  current: GeoCoordinates,
): GeoDirection {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const [prevLon, prevLat] = previous;
  const [currLon, currLat] = current;

  const prevLatRad = toRadians(prevLat);
  const currLatRad = toRadians(currLat);
  const deltaLonRad = toRadians(currLon - prevLon);

  const y = Math.sin(deltaLonRad) * Math.cos(currLatRad);
  const x =
    Math.cos(prevLatRad) * Math.sin(currLatRad) -
    Math.sin(prevLatRad) * Math.cos(currLatRad) * Math.cos(deltaLonRad);

  let bearingDegrees = Math.atan2(y, x) * (180 / Math.PI);
  bearingDegrees = (bearingDegrees + 360) % 360;

  if (bearingDegrees >= 337.5 || bearingDegrees < 22.5)
    return GeoDirection.North;
  if (bearingDegrees < 67.5) return GeoDirection.NorthEast;
  if (bearingDegrees < 112.5) return GeoDirection.East;
  if (bearingDegrees < 157.5) return GeoDirection.SouthEast;
  if (bearingDegrees < 202.5) return GeoDirection.South;
  if (bearingDegrees < 247.5) return GeoDirection.SouthWest;
  if (bearingDegrees < 292.5) return GeoDirection.West;
  return GeoDirection.NorthWest;
}

function convertKilometersToUnit(distanceKm: number, unit: GeoUnit): number {
  if (unit === "meter") return distanceKm * 1000;
  if (unit === "centimeter") return distanceKm * 100000;
  if (unit === "millimeter") return distanceKm * 1000000;
  if (unit === "mile") return distanceKm * 0.621371;
  if (unit === "foot") return distanceKm * 3280.84;
  if (unit === "yard") return distanceKm * 1093.61;
  if (unit === "inch") return distanceKm * 39370.1;
  if (unit === "mile-scandinavian") return distanceKm * 0.1;
  return distanceKm;
}

/**
 * Return a structured diff between two geographical coordinates.
 * @param {GeoCoordinates | null | undefined} previousCoordinates - The original coordinates (`[Longitude, Latitude]`).
 * @param {GeoCoordinates | null | undefined} coordinates - The new coordinates (`[Longitude, Latitude]`).
 * @param {TextDiffOptions} options - Options to refine your output.
  - `unit`: the unit used for the returned distance.
  - `accuracy`: 
    - `normal` (default): fastest mode, with a small error margin, based on Haversine formula.
    - `high`: slower but highly precise distance. Based on Vincenty formula.
  - `maxDecimals`: maximal decimals for the distance. Defaults to 2.
  - `locale`: the locale of your distance. Enables a locale‑aware distance label.
 * @returns GeoDiff
 */
export function getGeoDiff(
  previousCoordinates: GeoCoordinates | undefined | null,
  coordinates: GeoCoordinates | undefined | null,
  options: GeoDiffOptions = DEFAULT_GEODIFF_OPTIONS,
): GeoDiff {
  const unit: GeoUnit = options?.unit || DEFAULT_GEODIFF_OPTIONS.unit;
  const maxDecimals: number =
    options?.maxDecimals ?? DEFAULT_GEODIFF_OPTIONS.maxDecimals;
  if (
    areValidCoordinates(previousCoordinates) &&
    areValidCoordinates(coordinates)
  ) {
    let distanceKm: number;
    if (options.accuracy === "high") {
      try {
        distanceKm = getVincentyDistance(previousCoordinates, coordinates);
        if (typeof distanceKm !== "number" || isNaN(distanceKm)) throw Error;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_: unknown) {
        distanceKm = getHaversineDistance(previousCoordinates, coordinates);
      }
    } else {
      distanceKm = getHaversineDistance(previousCoordinates, coordinates);
    }
    const distanceNormalized = Number(
      convertKilometersToUnit(distanceKm, unit).toFixed(maxDecimals),
    );
    return {
      type: "geo",
      status: distanceKm === 0 ? GeoStatus.EQUAL : GeoStatus.UPDATED,
      diff: {
        coordinates,
        previousCoordinates,
        direction:
          distanceKm === 0
            ? GeoDirection.Stationary
            : getGeoDirection(previousCoordinates, coordinates),
        distance: distanceNormalized,
        label: getDistanceLabel(distanceNormalized, options),
        unit,
      },
    };
  }
  return {
    type: "geo",
    status:
      !previousCoordinates && !coordinates
        ? GeoStatus.EQUAL
        : !previousCoordinates
          ? GeoStatus.ADDED
          : !coordinates
            ? GeoStatus.DELETED
            : GeoStatus.ERROR,
    diff: {
      previousCoordinates: previousCoordinates || null,
      coordinates: coordinates || null,
      direction: GeoDirection.Stationary,
      distance: 0,
      label: getDistanceLabel(0, options),
      unit,
    },
  };
}
