import { GeoCoordinates } from "@models/geo";

const a = 6378137.0;           // semi-major axis (meters)
const f = 1 / 298.257223563;   // flattening
const b = a * (1 - f);         // semi-minor axis

export function getVincentyDistance(
    previous: GeoCoordinates,
    current: GeoCoordinates
): number {
    const [lon1, lat1] = previous;
    const [lon2, lat2] = current;

    // Early exit for identical points
    if (lon1 === lon2 && lat1 === lat2) return 0;

    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const λ1 = lon1 * Math.PI / 180;
    const λ2 = lon2 * Math.PI / 180;

    const L = λ2 - λ1;

    const U1 = Math.atan((1 - f) * Math.tan(φ1));
    const U2 = Math.atan((1 - f) * Math.tan(φ2));

    let λ = L;
    let λP: number;
    let sinσ: number;
    let cosσ: number;
    let σ: number;
    let sinα: number;
    let cosSqα: number;
    let cos2σm: number;
    let C: number;

    const iterationLimit = 100;
    let iter = 0;

    do {
        λP = λ;

        const sinλ = Math.sin(λ);
        const cosλ = Math.cos(λ);

        sinσ = Math.sqrt(
            (Math.cos(U2) * sinλ) ** 2 +
            (Math.cos(U1) * Math.sin(U2) - Math.sin(U1) * Math.cos(U2) * cosλ) ** 2
        );

        if (sinσ === 0) return 0;

        cosσ = Math.sin(U1) * Math.sin(U2) + Math.cos(U1) * Math.cos(U2) * cosλ;
        σ = Math.atan2(sinσ, cosσ);

        sinα = Math.cos(U1) * Math.cos(U2) * sinλ / sinσ;
        cosSqα = 1 - sinα * sinα;

        if (cosSqα === 0) {
            cos2σm = 0; // equatorial line
        } else {
            cos2σm = cosσ - (2 * Math.sin(U1) * Math.sin(U2)) / cosSqα;
        }

        C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
        λ = L + (1 - C) * f * sinα * (σ + C * sinσ * (cos2σm + C * cosσ * (-1 + 2 * cos2σm * cos2σm)));
    } while (Math.abs(λ - λP) > 1e-12 && ++iter < iterationLimit);

    if (iter >= iterationLimit) {
        // Non-convergence is rare; fallback to 0 or Haversine in caller
        return 0;
    }

    const uSq = cosSqα * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

    const Δσ = B * sinσ * (cos2σm + B / 4 * (cosσ * (-1 + 2 * cos2σm * cos2σm) -
        B / 6 * cos2σm * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σm * cos2σm)));

    const s = b * A * (σ - Δσ); // distance in meters

    return s / 1000; // kilometers
}