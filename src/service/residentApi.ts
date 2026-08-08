import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { AuditLogRecord, LoaiSoHuu, PaginatedData, ResidentRecord } from "@dts";
import { request } from "./request";

export interface ResidentRecordInput {
    houseId: string;
    ownershipType?: LoaiSoHuu;
    renterCount?: number;
    inspectionDate?: string;
}

export const fetchResidentRecords = (params?: {
    page?: number;
    limit?: number;
    houseId?: string;
}): Promise<PaginatedData<ResidentRecord>> =>
    request<PaginatedData<ResidentRecord>>("GET", API.RESIDENTS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        houseId: params?.houseId,
    });

export const fetchResidentRecordById = (id: string): Promise<ResidentRecord> =>
    request<ResidentRecord>("GET", `${API.RESIDENTS}/${id}`);

export const createResidentRecord = (
    input: ResidentRecordInput,
): Promise<ResidentRecord> =>
    request<ResidentRecord>("POST", API.RESIDENTS, input);

export const updateResidentRecord = (
    id: string,
    input: Partial<ResidentRecordInput>,
): Promise<ResidentRecord> =>
    request<ResidentRecord>("PATCH", `${API.RESIDENTS}/${id}`, input);

export const deleteResidentRecord = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.RESIDENTS}/${id}`);

export const fetchResidentAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.RESIDENTS}/${id}/audit-logs`,
        params,
    );
