import { API } from "@constants/common";
import { CompanyType, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchCompanyTypes = (params?: {
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<CompanyType>> =>
    request<PaginatedData<CompanyType>>("GET", API.COMPANY_TYPES, params);

export const fetchCompanyTypeById = (id: string): Promise<CompanyType> =>
    request<CompanyType>("GET", `${API.COMPANY_TYPES}/${id}`);

export interface CreateCompanyTypeParams {
    name: string;
    description?: string;
    active?: boolean;
    sortOrder?: number;
}

export const createCompanyType = (
    params: CreateCompanyTypeParams,
): Promise<CompanyType> =>
    request<CompanyType>("POST", API.COMPANY_TYPES, params);

export interface UpdateCompanyTypeParams {
    name?: string;
    description?: string;
    active?: boolean;
    sortOrder?: number;
}

export const updateCompanyType = (
    id: string,
    params: UpdateCompanyTypeParams,
): Promise<CompanyType> =>
    request<CompanyType>("PATCH", `${API.COMPANY_TYPES}/${id}`, params);

export const deleteCompanyType = (id: string): Promise<{ _id: string }> =>
    request<{ _id: string }>("DELETE", `${API.COMPANY_TYPES}/${id}`);
