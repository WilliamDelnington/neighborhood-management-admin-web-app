import { API } from "@constants/common";
import { CorrespondenceType, PaginatedData, Role } from "@dts";
import { request } from "./request";

export const fetchCorrespondenceTypes = (params?: {
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<CorrespondenceType>> =>
    request<PaginatedData<CorrespondenceType>>(
        "GET",
        API.CORRESPONDENCE_TYPES,
        params,
    );

/**
 * Danh sach loai van ban ma nguoi dang dang nhap co the gui (vai tro cua ho
 * nam trong allowedSenderRoles) - dung cho bo chon loai van ban khi soan, chi
 * doi hoi dang nhap (khong can correspondence_types.read, permission do chi
 * danh cho man quan tri danh muc) - xem app/api/correspondence-types/route.ts.
 */
export const fetchEligibleSenderCorrespondenceTypes = (): Promise<
    PaginatedData<CorrespondenceType>
> =>
    request<PaginatedData<CorrespondenceType>>(
        "GET",
        API.CORRESPONDENCE_TYPES,
        { eligibleSender: 1, limit: 100 },
    );

export interface CorrespondenceTypeParams {
    name: string;
    code?: string;
    description?: string;
    allowedSenderRoles: Role[];
    allowedReceiverRoles: Role[];
    requireDocumentNumber?: boolean;
    active?: boolean;
}

export const createCorrespondenceType = (
    params: CorrespondenceTypeParams,
): Promise<CorrespondenceType> =>
    request<CorrespondenceType>(
        "POST",
        API.CORRESPONDENCE_TYPES,
        params,
    );

export const updateCorrespondenceType = (
    id: string,
    params: Partial<CorrespondenceTypeParams>,
): Promise<CorrespondenceType> =>
    request<CorrespondenceType>(
        "PATCH",
        `${API.CORRESPONDENCE_TYPES}/${id}`,
        params,
    );

export const deleteCorrespondenceType = (id: string): Promise<{ _id: string }> =>
    request<{ _id: string }>("DELETE", `${API.CORRESPONDENCE_TYPES}/${id}`);
