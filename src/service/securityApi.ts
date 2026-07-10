import { API } from "@constants/common";
import { MucDoAnNinh, PaginatedData, SecurityRecord } from "@dts";
import { request } from "./request";

export interface SecurityRecordInput {
    householdId: string;
    ownershipType?: "chinh_chu" | "cho_thue";
    renterCount?: number;
    temporaryResidenceDeclared?: boolean;
    hasCamera?: boolean;
    hasSecurityComplaint?: boolean;
    level?: MucDoAnNinh;
    reportedToPolice?: boolean;
    handlingStatus?: string;
    note?: string;
}

export const fetchSecurityRecords = (params?: {
    page?: number;
    limit?: number;
    level?: MucDoAnNinh;
    householdId?: string;
}): Promise<PaginatedData<SecurityRecord>> =>
    request<PaginatedData<SecurityRecord>>("GET", API.SECURITY, params);

export const fetchSecurityRecordById = (id: string): Promise<SecurityRecord> =>
    request<SecurityRecord>("GET", `${API.SECURITY}/${id}`);

export const createSecurityRecord = (
    input: SecurityRecordInput,
): Promise<SecurityRecord> =>
    request<SecurityRecord>("POST", API.SECURITY, input);

export const updateSecurityRecord = (
    id: string,
    input: Partial<SecurityRecordInput>,
): Promise<SecurityRecord> =>
    request<SecurityRecord>("PATCH", `${API.SECURITY}/${id}`, input);

export const deleteSecurityRecord = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.SECURITY}/${id}`);
