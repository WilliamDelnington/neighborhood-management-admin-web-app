import { API } from "@constants/common";
import { BusinessType, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchBusinessTypes = (params?: {
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<BusinessType>> =>
    request<PaginatedData<BusinessType>>("GET", API.BUSINESS_TYPES, params);

export const fetchBusinessTypeById = (id: string): Promise<BusinessType> =>
    request<BusinessType>("GET", `${API.BUSINESS_TYPES}/${id}`);

export interface CreateBusinessTypeParams {
    name: string;
    description?: string;
    active?: boolean;
    sortOrder?: number;
}

export const createBusinessType = (
    params: CreateBusinessTypeParams,
): Promise<BusinessType> =>
    request<BusinessType>("POST", API.BUSINESS_TYPES, params);

export interface UpdateBusinessTypeParams {
    name?: string;
    description?: string;
    active?: boolean;
    sortOrder?: number;
}

export const updateBusinessType = (
    id: string,
    params: UpdateBusinessTypeParams,
): Promise<BusinessType> =>
    request<BusinessType>("PATCH", `${API.BUSINESS_TYPES}/${id}`, params);

export const deleteBusinessType = (id: string): Promise<{ _id: string }> =>
    request<{ _id: string }>("DELETE", `${API.BUSINESS_TYPES}/${id}`);
