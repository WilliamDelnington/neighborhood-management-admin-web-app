import { API } from "@constants/common";
import { PoiCategory } from "@dts";
import { request } from "./request";

// Tom tat Household duoc backend populate san khi category = "household" (xem
// HOUSEHOLD_POPUP_FIELDS trong poiService.ts) - vua du de hien popup, khong
// phai goi them fetchHouseholdById.
export interface PoiHouseholdSummary {
    _id: string;
    code: string;
    headOfHousehold: string;
    phone?: string;
    address: string;
    status: string;
}

export interface Poi {
    _id: string;
    name: string;
    category: PoiCategory;
    lat: number;
    lng: number;
    address?: string;
    verified: boolean;
    source: "manual" | "scan";
    // Chi co gia tri (da populate) khi category = "household".
    householdId?: PoiHouseholdSummary | string | null;
    createdAt: string;
    updatedAt: string;
}

export const fetchPois = (params?: {
    category?: PoiCategory;
    verified?: boolean;
}): Promise<Poi[]> => request<Poi[]>("GET", API.POIS, params);

export interface PoiInput {
    name: string;
    category: PoiCategory;
    lat: number;
    lng: number;
    address?: string;
    verified?: boolean;
    // Bat buoc khi category = "household".
    householdId?: string;
}

export const createPoi = (input: PoiInput): Promise<Poi> =>
    request<Poi>("POST", API.POIS, input);

export const updatePoi = (id: string, input: Partial<PoiInput>): Promise<Poi> =>
    request<Poi>("PATCH", `${API.POIS}/${id}`, input);

export const deletePoi = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.POIS}/${id}`);

export interface ScanPoisResult {
    category: PoiCategory;
    label: string;
    created: number;
    skippedExisting: number;
}

export const scanPois = (): Promise<ScanPoisResult[]> =>
    request<ScanPoisResult[]>("POST", `${API.POIS}/scan`);
