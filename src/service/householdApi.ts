import { API } from "@constants/common";
import { Household, PaginatedData } from "@dts";
import { request } from "./request";

export interface HouseholdInput {
    cluster: string;
    address: string;
    headOfHousehold: string;
    // Lien ket toi tai khoan house_owner thuc su - null = khong lien ket.
    headOfHouseholdUserId?: string | null;
    phone?: string;
    memberCount?: number;
    ownershipType?: "chinh_chu" | "cho_thue";
    needsSupport?: boolean;
    // id House, hoac null de go lien ket (chua gan nha so).
    houseId?: string | null;
    note?: string;
}

export const fetchHouseholds = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cluster?: string;
    houseId?: string;
    unassigned?: boolean;
}): Promise<PaginatedData<Household>> =>
    request<PaginatedData<Household>>("GET", API.HOUSEHOLDS, params);

export const fetchHouseholdById = (id: string): Promise<Household> =>
    request<Household>("GET", `${API.HOUSEHOLDS}/${id}`);

export const fetchHouseholdCitizens = (id: string) =>
    request("GET", `${API.HOUSEHOLDS}/${id}/citizens`);

export const createHousehold = (input: HouseholdInput): Promise<Household> =>
    request<Household>("POST", API.HOUSEHOLDS, input);

export const updateHousehold = (
    id: string,
    input: Partial<HouseholdInput>,
): Promise<Household> =>
    request<Household>("PATCH", `${API.HOUSEHOLDS}/${id}`, input);

export const deleteHousehold = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.HOUSEHOLDS}/${id}`);
