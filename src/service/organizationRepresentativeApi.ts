import { API } from "@constants/common";
import { OrganizationRepresentative, OrganizationRepresentativeRole } from "@dts";
import { request } from "./request";

export const fetchOrganizationRepresentatives = (
    organizationId: string,
): Promise<OrganizationRepresentative[]> =>
    request<OrganizationRepresentative[]>(
        "GET",
        `${API.ORGANIZATIONS}/${organizationId}/representatives`,
    );

export interface AddOrganizationRepresentativeInput {
    userId: string;
    role: OrganizationRepresentativeRole;
    title?: string;
    reason?: string;
}

// role="legal_representative" se CHUYEN nguoi dai dien phap luat (ket thuc
// ban ghi dang active va tao ban ghi moi) thay vi chi them - xem
// organizationRepresentativeService.addOrganizationRepresentative o backend.
export const addOrganizationRepresentative = (
    organizationId: string,
    input: AddOrganizationRepresentativeInput,
): Promise<OrganizationRepresentative> =>
    request<OrganizationRepresentative>(
        "POST",
        `${API.ORGANIZATIONS}/${organizationId}/representatives`,
        input,
    );

export const endOrganizationRepresentative = (
    organizationId: string,
    representativeId: string,
    reason?: string,
): Promise<OrganizationRepresentative> =>
    request<OrganizationRepresentative>(
        "PATCH",
        `${API.ORGANIZATIONS}/${organizationId}/representatives/${representativeId}`,
        { reason },
    );

// note bat buoc khi decision="rejected" (backend tu choi neu thieu) - xem
// verifyOrganizationRepresentativeSchema.
export const verifyOrganizationRepresentative = (
    organizationId: string,
    representativeId: string,
    decision: "verified" | "rejected",
    note?: string,
): Promise<OrganizationRepresentative> =>
    request<OrganizationRepresentative>(
        "POST",
        `${API.ORGANIZATIONS}/${organizationId}/representatives/${representativeId}/verify`,
        { decision, note },
    );
