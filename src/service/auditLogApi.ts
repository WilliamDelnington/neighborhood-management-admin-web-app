import { API } from "@constants/common";
import { AuditLogRecord, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchAuditLogs = (params?: {
    action?: string;
    targetModel?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>("GET", API.AUDIT_LOGS, params);
