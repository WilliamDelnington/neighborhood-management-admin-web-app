import { API } from "@constants/common";
import {
    AuditLogRecord,
    MucDoAnNinh,
    PaginatedData,
    SecurityRecord,
    TinhTrangTheoDoiAnNinh,
} from "@dts";
import { request } from "./request";

export interface SecurityRecordInput {
    houseId: string;
    ownershipType?: "chinh_chu" | "cho_thue";
    renterCount?: number;
    hasCamera?: boolean;
    hasSecurityComplaint?: boolean;
    level?: MucDoAnNinh;
    reportedToPolice?: boolean;
    monitoringStatus?: TinhTrangTheoDoiAnNinh;
    note?: string;
    inspectionDate?: string;
}

export const fetchSecurityRecords = (params?: {
    page?: number;
    limit?: number;
    level?: MucDoAnNinh;
    houseId?: string;
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

export const assignSecurityRecord = (
    id: string,
    input: { assigneeId: string },
): Promise<SecurityRecord> =>
    request<SecurityRecord>("PATCH", `${API.SECURITY}/${id}/assign`, input);

export const fetchSecurityAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.SECURITY}/${id}/audit-logs`,
        params,
    );
