import { getGeoDiff } from "./index";
import {
  GeoCoordinates,
  GeoDiff,
  GeoDirection,
  GeoStatus,
  GeoUnit,
} from "@models/geo";

const PARIS: GeoCoordinates = [2.3522, 48.8566];
const LONDON: GeoCoordinates = [-0.1278, 51.5074];
const TOKYO: GeoCoordinates = [139.6917, 35.6895];
const PARIS_VERY_CLOSE: GeoCoordinates = [2.35221, 48.85661]; // ~1 meter away

describe("getGeoDiff", () => {
  it("returns EQUAL when no previous and current coordinates are provided", () => {
    expect(getGeoDiff(null, undefined)).toStrictEqual({
      type: "geo",
      status: GeoStatus.EQUAL,
      diff: {
        previousCoordinates: null,
        coordinates: null,
        direction: GeoDirection.Stationary,
        distance: 0,
        label: "0 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("returns ADDED when no previous coordinates are provided", () => {
    expect(getGeoDiff(null, PARIS)).toStrictEqual({
      type: "geo",
      status: GeoStatus.ADDED,
      diff: {
        previousCoordinates: null,
        coordinates: PARIS,
        direction: GeoDirection.Stationary,
        distance: 0,
        label: "0 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("returns DELETED when no current coordinates are provided", () => {
    expect(getGeoDiff(PARIS, undefined)).toStrictEqual({
      type: "geo",
      status: GeoStatus.DELETED,
      diff: {
        previousCoordinates: PARIS,
        coordinates: null,
        direction: GeoDirection.Stationary,
        distance: 0,
        label: "0 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("returns ERROR when coordinates are invalid", () => {
    //@ts-expect-error - we want to test invalid coordinates
    expect(getGeoDiff([1, 2, 3], [1, "5"])).toStrictEqual({
      type: "geo",
      status: GeoStatus.ERROR,
      diff: {
        previousCoordinates: [1, 2, 3],
        coordinates: [1, "5"],
        direction: GeoDirection.Stationary,
        distance: 0,
        label: "0 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("returns EQUAL when coordinates are identical", () => {
    expect(getGeoDiff(PARIS, PARIS)).toStrictEqual({
      type: "geo",
      status: GeoStatus.EQUAL,
      diff: {
        coordinates: PARIS,
        previousCoordinates: PARIS,
        direction: GeoDirection.Stationary,
        distance: 0,
        label: "0 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("returns UPDATED when coordinates are slightly different - normal accuracy", () => {
    expect(
      getGeoDiff(PARIS, PARIS_VERY_CLOSE, {
        unit: "meter",
        accuracy: "normal",
      }),
    ).toStrictEqual({
      type: "geo",
      status: GeoStatus.UPDATED,
      diff: {
        coordinates: PARIS_VERY_CLOSE,
        previousCoordinates: PARIS,
        direction: GeoDirection.NorthEast,
        distance: 1.33,
        label: "1.33 meters",
        unit: "meter",
      },
    });
  });
  it("returns UPDATED when coordinates are slightly different - high accuracy", () => {
    expect(
      getGeoDiff(PARIS, PARIS_VERY_CLOSE, { unit: "meter", accuracy: "high" }),
    ).toStrictEqual({
      type: "geo",
      status: GeoStatus.UPDATED,
      diff: {
        coordinates: PARIS_VERY_CLOSE,
        previousCoordinates: PARIS,
        direction: GeoDirection.NorthEast,
        distance: 1.33,
        label: "1.33 meters",
        unit: "meter",
      },
    });
  });
  it("returns UPDATED when coordinates are different - normal accuracy", () => {
    expect(getGeoDiff(PARIS, LONDON)).toStrictEqual({
      type: "geo",
      status: "updated",
      diff: {
        coordinates: [-0.1278, 51.5074],
        previousCoordinates: [2.3522, 48.8566],
        direction: GeoDirection.NorthWest,
        distance: 343.56,
        label: "343.56 kilometers",
        unit: "kilometer",
      },
    });
    expect(getGeoDiff(PARIS, TOKYO)).toStrictEqual({
      type: "geo",
      status: "updated",
      diff: {
        coordinates: [139.6917, 35.6895],
        previousCoordinates: [2.3522, 48.8566],
        direction: GeoDirection.NorthEast,
        distance: 9712.07,
        label: "9,712.07 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("returns UPDATED when coordinates are different - high accuracy", () => {
    expect(getGeoDiff(PARIS, LONDON, { accuracy: "high" })).toStrictEqual({
      type: "geo",
      status: "updated",
      diff: {
        coordinates: [-0.1278, 51.5074],
        previousCoordinates: [2.3522, 48.8566],
        direction: GeoDirection.NorthWest,
        distance: 343.92,
        label: "343.92 kilometers",
        unit: "kilometer",
      },
    });
    expect(getGeoDiff(PARIS, TOKYO, { accuracy: "high" })).toStrictEqual({
      type: "geo",
      status: "updated",
      diff: {
        coordinates: [139.6917, 35.6895],
        previousCoordinates: [2.3522, 48.8566],
        direction: GeoDirection.NorthEast,
        distance: 9735.66,
        label: "9,735.66 kilometers",
        unit: "kilometer",
      },
    });
  });
  it("properly compute different units", () => {
    const formatDiff = (
      distance: number,
      label: string,
      unit: GeoUnit,
    ): GeoDiff => ({
      type: "geo",
      status: GeoStatus.UPDATED,
      diff: {
        coordinates: LONDON,
        previousCoordinates: PARIS,
        direction: GeoDirection.NorthWest,
        distance,
        label,
        unit,
      },
    });
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "centimeter", maxDecimals: 0 }),
    ).toStrictEqual(
      formatDiff(34355606, "34,355,606 centimeters", "centimeter"),
    );
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "foot", maxDecimals: 0 }),
    ).toStrictEqual(formatDiff(1127152, "1,127,152 feet", "foot"));
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "inch", maxDecimals: 0 }),
    ).toStrictEqual(formatDiff(13525836, "13,525,836 inches", "inch"));
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "kilometer", maxDecimals: 0 }),
    ).toStrictEqual(formatDiff(344, "344 kilometers", "kilometer"));
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "meter", maxDecimals: 0 }),
    ).toStrictEqual(formatDiff(343556, "343,556 meters", "meter"));
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "mile", maxDecimals: 0 }),
    ).toStrictEqual(formatDiff(213, "213 miles", "mile"));
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "mile-scandinavian", maxDecimals: 0 }),
    ).toStrictEqual(
      formatDiff(34, "34 miles-scandinavian", "mile-scandinavian"),
    );
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "millimeter", maxDecimals: 0 }),
    ).toStrictEqual(
      formatDiff(343556060, "343,556,060 millimeters", "millimeter"),
    );
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "yard", maxDecimals: 0 }),
    ).toStrictEqual(formatDiff(375716, "375,716 yards", "yard"));
  });
  it("return locale-aware labels", () => {
    expect(
      getGeoDiff(PARIS, LONDON, {
        unit: "kilometer",
        locale: "it-IT",
        maxDecimals: 0,
      }).diff.label,
    ).toStrictEqual("344 chilometri");
    expect(
      getGeoDiff(PARIS, LONDON, {
        unit: "kilometer",
        locale: "zh",
        maxDecimals: 0,
      }).diff.label,
    ).toBe("344公里");
  });
  it("handles maxDecimals", () => {
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "meter", maxDecimals: 0 }).diff
        .distance,
    ).toStrictEqual(343556);
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "meter", maxDecimals: 1 }).diff
        .distance,
    ).toStrictEqual(343556.1);
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "meter", maxDecimals: 5 }).diff
        .distance,
    ).toStrictEqual(343556.06034);
    // 2 decimals by default
    expect(
      getGeoDiff(PARIS, LONDON, { unit: "meter" }).diff.distance,
    ).toStrictEqual(343556.06);
  });
  it("falls back to Haversine when Vincenty throws", async () => {
    jest.resetModules();
    jest.doMock("./vincenty", () => ({
      getVincentyDistance: jest.fn(() => {
        throw new Error("Vincenty convergence failed");
      }),
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getGeoDiff } = require(".");
    expect(getGeoDiff(PARIS, LONDON, { accuracy: "high" })).toStrictEqual({
      type: "geo",
      status: "updated",
      diff: {
        coordinates: [-0.1278, 51.5074],
        previousCoordinates: [2.3522, 48.8566],
        direction: "north-west",
        distance: 343.56,
        label: "343.56 kilometers",
        unit: "kilometer",
      },
    });
  });
});
