

export type GeoUnit = "centimeter" | "foot" | "inch" | "kilometer" | "meter" | "mile" | "mile-scandinavian" | "millimeter" | "yard"

export type GeoDiffOptions = {
    unit?: GeoUnit;
    maxDecimals?: number;
    accuracy?: "normal" | "high"
    locale?: Intl.Locale | string;
};

export const DEFAULT_GEODIFF_OPTIONS: Required<GeoDiffOptions> = {
    unit: "kilometer",
    maxDecimals: 2,
    accuracy: "normal",
    locale: "en-US"
}

export enum GeoStatus {
    ADDED = "added",
    DELETED = "deleted",
    ERROR = "error",
    EQUAL = "equal",
    UPDATED = "updated",
}

type Longitude = number;
type Latitude = number;

export type GeoCoordinates = [Longitude, Latitude]
export enum GeoDirection {
    East = "east",
    North = "north",
    South = "south",
    West = "west",
    NorthEast = "north-east",
    NorthWest = "north-west",
    SouthEast = "south-east",
    SouthWest = "south-west",
    Stationary = "stationary"
}

export type GeoDiff = {
    type: "geo";
    status: GeoStatus;
    diff: {
        coordinates: GeoCoordinates | null;
        previousCoordinates: GeoCoordinates | null;
        distance: number;
        unit: GeoUnit,
        label: string,
        direction: GeoDirection;
    };
};
