import { API } from "@constants/common";
import { Organization, OrganizationType, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchOrganizations = (
    params: {
        page?: number;
        limit?: number;
        search?: string;
        active?: boolean;
    } = {},
): Promise<PaginatedData<Organization>> =>
    request<PaginatedData<Organization>>("GET", API.ORGANIZATIONS, {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
        active: params.active,
    });

export const fetchOrganizationById = (id: string): Promise<Organization> =>
    request<Organization>("GET", `${API.ORGANIZATIONS}/${id}`);

export interface OrganizationInput {
    name: string;
    taxCode?: string;
    organizationType: OrganizationType;
    // Chi admin can gui - house_owner tu tao to chuc luon bi ep ve chinh minh
    // o backend (xem organizationService.createOrganization), bo qua truong
    // nay neu co gui.
    representativeUserId?: string;
    representativeRole?: string;
    phone?: string;
    email?: string;
    address?: string;
    active?: boolean;
}

export const createOrganization = (
    input: OrganizationInput,
): Promise<Organization> =>
    request<Organization>("POST", API.ORGANIZATIONS, input);

// taxCode la bat bien sau khi tao - khong nam trong kieu cap nhat.
export type UpdateOrganizationInput = Partial<
    Omit<OrganizationInput, "taxCode">
>;

export const updateOrganization = (
    id: string,
    input: UpdateOrganizationInput,
): Promise<Organization> =>
    request<Organization>("PATCH", `${API.ORGANIZATIONS}/${id}`, input);
