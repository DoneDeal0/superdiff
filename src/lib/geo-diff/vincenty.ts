import { GeoCoordinates } from "@models/geo";

const SEMI_MAJOR_AXIS_METER = 6378137.0;
const FLATTENING = 1 / 298.257223563;
const SEMI_MINOR_AXIS_METER = SEMI_MAJOR_AXIS_METER * (1 - FLATTENING);

export function getVincentyDistance(
  previous: GeoCoordinates,
  current: GeoCoordinates,
): number {
  const [lon1, lat1] = previous;
  const [lon2, lat2] = current;

  if (lon1 === lon2 && lat1 === lat2) return 0;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const deltaLambda = λ2 - λ1;
  const reducedLat1 = Math.atan((1 - FLATTENING) * Math.tan(φ1));
  const reducedLat2 = Math.atan((1 - FLATTENING) * Math.tan(φ2));

  let λ = deltaLambda;
  let previousLambda: number;
  let sinσ: number;
  let cosσ: number;
  let σ: number;
  let sinα: number;
  let cosSqα: number;
  let cos2σm: number;
  let correctionFactor: number;

  const iterationLimit = 100;
  let iter = 0;

  do {
    previousLambda = λ;

    const sinλ = Math.sin(λ);
    const cosλ = Math.cos(λ);

    sinσ = Math.sqrt(
      (Math.cos(reducedLat2) * sinλ) ** 2 +
        (Math.cos(reducedLat1) * Math.sin(reducedLat2) -
          Math.sin(reducedLat1) * Math.cos(reducedLat2) * cosλ) **
          2,
    );

    if (sinσ === 0) return 0;

    cosσ =
      Math.sin(reducedLat1) * Math.sin(reducedLat2) +
      Math.cos(reducedLat1) * Math.cos(reducedLat2) * cosλ;

    σ = Math.atan2(sinσ, cosσ);
    sinα = (Math.cos(reducedLat1) * Math.cos(reducedLat2) * sinλ) / sinσ;
    cosSqα = 1 - sinα * sinα;

    if (cosSqα === 0) {
      cos2σm = 0;
    } else {
      cos2σm =
        cosσ - (2 * Math.sin(reducedLat1) * Math.sin(reducedLat2)) / cosSqα;
    }

    correctionFactor =
      (FLATTENING / 16) * cosSqα * (4 + FLATTENING * (4 - 3 * cosSqα));

    λ =
      deltaLambda +
      (1 - correctionFactor) *
        FLATTENING *
        sinα *
        (σ +
          correctionFactor *
            sinσ *
            (cos2σm + correctionFactor * cosσ * (-1 + 2 * cos2σm * cos2σm)));
  } while (Math.abs(λ - previousLambda) > 1e-12 && ++iter < iterationLimit);

  if (iter >= iterationLimit) return 0;

  const ellipsoidParameter =
    (cosSqα * (SEMI_MAJOR_AXIS_METER ** 2 - SEMI_MINOR_AXIS_METER ** 2)) /
    SEMI_MINOR_AXIS_METER ** 2;

  const seriesA =
    1 +
    (ellipsoidParameter / 16384) *
      (4096 +
        ellipsoidParameter *
          (-768 + ellipsoidParameter * (320 - 175 * ellipsoidParameter)));

  const seriesB =
    (ellipsoidParameter / 1024) *
    (256 +
      ellipsoidParameter *
        (-128 + ellipsoidParameter * (74 - 47 * ellipsoidParameter)));

  const deltaSigma =
    seriesB *
    sinσ *
    (cos2σm +
      (seriesB / 4) *
        (cosσ * (-1 + 2 * cos2σm * cos2σm) -
          (seriesB / 6) *
            cos2σm *
            (-3 + 4 * sinσ * sinσ) *
            (-3 + 4 * cos2σm * cos2σm)));

  return (SEMI_MINOR_AXIS_METER * seriesA * (σ - deltaSigma)) / 1000;
}
