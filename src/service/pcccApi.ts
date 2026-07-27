import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    AuditLogRecord,
    MucNguyCoPccc,
    PaginatedData,
    PcccAttachment,
    PcccCheck,
    TinhTrangTheoDoiPccc,
} from "@dts";
import { request } from "./request";

export interface PcccCheckInput {
    houseId: string;
    hasFireExtinguisher?: boolean;
    hasEmergencyExit?: boolean;
    hasIndoorEvCharging?: boolean;
    hasGasStoveOrStorageOrBusiness?: boolean;
    isCrowdedRental?: boolean;
    riskLevel?: MucNguyCoPccc;
    remediationNeeded?: string;
    inspectionDate: string;
    inspectorId?: string;
    followUpStatus?: TinhTrangTheoDoiPccc;
}

export const fetchPcccChecks = (params?: {
    page?: number;
    limit?: number;
    riskLevel?: MucNguyCoPccc;
    houseId?: string;
}): Promise<PaginatedData<PcccCheck>> =>
    request<PaginatedData<PcccCheck>>("GET", API.PCCC, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        riskLevel: params?.riskLevel,
        houseId: params?.houseId,
    });

export const fetchPcccCheckById = (id: string): Promise<PcccCheck> =>
    request<PcccCheck>("GET", `${API.PCCC}/${id}`);

export const createPcccCheck = (input: PcccCheckInput): Promise<PcccCheck> =>
    request<PcccCheck>("POST", API.PCCC, input);

export const updatePcccCheck = (
    id: string,
    input: Partial<PcccCheckInput>,
): Promise<PcccCheck> =>
    request<PcccCheck>("PATCH", `${API.PCCC}/${id}`, input);

export const deletePcccCheck = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.PCCC}/${id}`);

export const fetchPcccRiskSummary = (): Promise<Record<string, number>> =>
    request<Record<string, number>>("GET", `${API.PCCC}/summary`);

export const assignPcccCheck = (
    id: string,
    input: { assigneeId: string; deadline?: string },
): Promise<PcccCheck> =>
    request<PcccCheck>("PATCH", `${API.PCCC}/${id}/assign`, input);

export const fetchPcccAttachments = (id: string): Promise<PcccAttachment[]> =>
    request<PcccAttachment[]>("GET", `${API.PCCC}/${id}/attachments`);

export const uploadPcccAttachment = (
    id: string,
    file: File,
): Promise<PcccAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<PcccAttachment>(
        "POST",
        `${API.PCCC}/${id}/attachments`,
        formData,
    );
};

export const deletePcccAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>("DELETE", `${API.PCCC}/${id}/attachments/${fileId}`);

export const fetchPcccAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.PCCC}/${id}/audit-logs`,
        params,
    );
