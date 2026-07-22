import { API } from "@constants/common";
import { Business } from "@dts";
import { request } from "./request";

export interface BusinessInput {
    name: string;
    houseId: string;
    // id BusinessType, hoac null de bo chon.
    businessType?: string | null;
    ownerName?: string;
    phone?: string;
    active?: boolean;
    note?: string;
}

export const createBusiness = (input: BusinessInput): Promise<Business> =>
    request<Business>("POST", API.BUSINESSES, input);

export const updateBusiness = (
    id: string,
    input: Partial<Omit<BusinessInput, "houseId">>,
): Promise<Business> =>
    request<Business>("PATCH", `${API.BUSINESSES}/${id}`, input);

export const deleteBusiness = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.BUSINESSES}/${id}`);
