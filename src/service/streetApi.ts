import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { PaginatedData, Street } from "@dts";
import { request } from "./request";

export interface FetchStreetsParams {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
}

export const fetchStreets = (
    params: FetchStreetsParams = {},
): Promise<PaginatedData<Street>> =>
    request<PaginatedData<Street>>("GET", API.STREETS, {
        page: params.page ?? 1,
        limit: params.limit ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        active: params.active,
    });

export const fetchStreetById = (id: string): Promise<Street> =>
    request<Street>("GET", `${API.STREETS}/${id}`);

export interface StreetInput {
    name: string;
    code: string;
    active?: boolean;
}

export const createStreet = (input: StreetInput): Promise<Street> =>
    request<Street>("POST", API.STREETS, input);

// code la bat bien sau khi tao - khong nam trong kieu cap nhat.
export type UpdateStreetInput = Partial<Omit<StreetInput, "code">>;

export const updateStreet = (
    id: string,
    input: UpdateStreetInput,
): Promise<Street> => request<Street>("PATCH", `${API.STREETS}/${id}`, input);
