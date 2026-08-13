import { API } from "@constants/common";
import { PaginatedData, UtilityApp } from "@dts";
import { request } from "./request";

export const fetchUtilityApps = (params?: {
    page?: number;
    limit?: number;
}): Promise<PaginatedData<UtilityApp>> =>
    request<PaginatedData<UtilityApp>>("GET", API.UTILITY_APPS, {
        ...params,
        admin: 1,
    });

export interface UtilityAppInput {
    name: string;
    icon: string;
    url: string;
    active?: boolean;
    sortOrder?: number;
}

export const createUtilityApp = (
    input: UtilityAppInput,
): Promise<UtilityApp> =>
    request<UtilityApp>("POST", API.UTILITY_APPS, input);

export const updateUtilityApp = (
    id: string,
    input: Partial<UtilityAppInput>,
): Promise<UtilityApp> =>
    request<UtilityApp>("PATCH", `${API.UTILITY_APPS}/${id}`, input);

export const deleteUtilityApp = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.UTILITY_APPS}/${id}`);
