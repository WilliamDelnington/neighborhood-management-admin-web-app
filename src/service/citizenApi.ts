import { API } from "@constants/common";
import { Citizen, GioiTinh, LoaiCuTru, PaginatedData } from "@dts";
import { request } from "./request";

export interface CitizenInput {
    fullName: string;
    phone?: string;
    cccd?: string;
    birthDate?: string;
    gender?: GioiTinh;
    relationToHead?: string;
    householdId: string;
    residenceType?: LoaiCuTru;
    isElderly?: boolean;
    isChild?: boolean;
    isDisabledOrSupportNeeded?: boolean;
    isPartyMember?: boolean;
    isUnionMember?: boolean;
}

export const fetchCitizens = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    householdId?: string;
}): Promise<PaginatedData<Citizen>> =>
    request<PaginatedData<Citizen>>("GET", API.CITIZENS, params);

export const fetchCitizenById = (id: string): Promise<Citizen> =>
    request<Citizen>("GET", `${API.CITIZENS}/${id}`);

export const createCitizen = (input: CitizenInput): Promise<Citizen> =>
    request<Citizen>("POST", API.CITIZENS, input);

export const updateCitizen = (
    id: string,
    input: Partial<CitizenInput>,
): Promise<Citizen> =>
    request<Citizen>("PATCH", `${API.CITIZENS}/${id}`, input);

export const deleteCitizen = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.CITIZENS}/${id}`);
