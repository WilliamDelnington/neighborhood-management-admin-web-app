import { API } from "@constants/common";
import { House, HouseStatus, PaginatedData } from "@dts";
import { request } from "./request";

export interface HouseInput {
    cluster: string;
    address: string;
    note?: string;
}

export const fetchHouses = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cluster?: string;
}): Promise<PaginatedData<House>> =>
    request<PaginatedData<House>>("GET", API.HOUSES, params);

export const fetchHouseById = (id: string): Promise<House> =>
    request<House>("GET", `${API.HOUSES}/${id}`);

export const fetchHouseHouseholds = (
    id: string,
    params?: { page?: number; limit?: number; search?: string },
) => request("GET", `${API.HOUSES}/${id}/households`, params);

export const fetchHouseBusinesses = (
    id: string,
    params?: { page?: number; limit?: number },
) => request("GET", `${API.HOUSES}/${id}/businesses`, params);

export const createHouse = (input: HouseInput): Promise<House> =>
    request<House>("POST", API.HOUSES, input);

export const updateHouse = (
    id: string,
    input: Partial<HouseInput>,
): Promise<House> => request<House>("PATCH", `${API.HOUSES}/${id}`, input);

export const deleteHouse = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.HOUSES}/${id}`);

export const updateHouseStatus = (
    id: string,
    status: HouseStatus,
): Promise<House> =>
    request<House>("PATCH", `${API.HOUSES}/${id}/status`, { status });
