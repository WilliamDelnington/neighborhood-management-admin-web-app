import { API } from "@constants/common";
import { PoiCategory } from "@dts";
import { request } from "./request";

export interface Poi {
    _id: string;
    name: string;
    category: PoiCategory;
    lat: number;
    lng: number;
    address?: string;
    verified: boolean;
    source: "manual" | "scan";
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
