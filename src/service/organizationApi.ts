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

export interface CreateOrganizationInput {
    name: string;
    taxCode?: string;
    organizationType: OrganizationType;
    // Chi admin can gui - house_owner tu tao to chuc luon bi ep ve chinh minh
    // o backend (xem organizationService.createOrganization), bo qua truong
    // nay neu co gui. Duoc tao thanh ban ghi OrganizationRepresentative
    // (role="legal_representative") - xem organizationRepresentativeApi.ts
    // de them/chuyen nguoi dai dien SAU khi to chuc da ton tai.
    representativeUserId?: string;
    representativeTitle?: string;
    phone?: string;
    email?: string;
    address?: string;
    active?: boolean;
}

export const createOrganization = (
    input: CreateOrganizationInput,
): Promise<Organization> =>
    request<Organization>("POST", API.ORGANIZATIONS, input);

// taxCode la bat bien sau khi tao; representativeUserId/representativeTitle
// KHONG con sua duoc qua day nua - doi nguoi dai dien phai di qua
// organizationRepresentativeApi.ts (them/ket thuc/xac thuc), dam bao luon co
// lich su thay vi bi ghi de.
export type UpdateOrganizationInput = Partial<
    Omit<
        CreateOrganizationInput,
        "taxCode" | "representativeUserId" | "representativeTitle"
    >
>;

export const updateOrganization = (
    id: string,
    input: UpdateOrganizationInput,
): Promise<Organization> =>
    request<Organization>("PATCH", `${API.ORGANIZATIONS}/${id}`, input);
