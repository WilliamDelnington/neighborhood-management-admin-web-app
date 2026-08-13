import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    Complaint,
    ComplaintDetail,
    FileAsset,
    NhomPhanAnh,
    PaginatedData,
    TrangThaiPhanAnh,
} from "@dts";
import { request } from "./request";

export const fetchComplaintAttachments = (id: string): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.COMPLAINTS}/${id}/attachments`);

export const fetchComplaints = (params?: {
    page?: number;
    limit?: number;
    status?: TrangThaiPhanAnh;
    category?: NhomPhanAnh;
    search?: string;
    relatedAssetId?: string;
}): Promise<PaginatedData<Complaint>> =>
    request<PaginatedData<Complaint>>("GET", API.COMPLAINTS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        status: params?.status,
        category: params?.category,
        search: params?.search,
        relatedAssetId: params?.relatedAssetId,
    });

export const fetchComplaintDetail = (id: string): Promise<ComplaintDetail> =>
    request<ComplaintDetail>("GET", `${API.COMPLAINTS}/${id}`);

export const deleteComplaint = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.COMPLAINTS}/${id}`);

export interface UpdateComplaintStatusInput {
    status: TrangThaiPhanAnh;
    note?: string;
    isPublic?: boolean;
}

export const updateComplaintStatus = (
    id: string,
    input: UpdateComplaintStatusInput,
): Promise<Complaint> =>
    request<Complaint>("PATCH", `${API.COMPLAINTS}/${id}/status`, input);

export const assignComplaint = (
    id: string,
    primaryAssigneeId: string,
    expectedCompletionDate?: string,
    transferReason?: string,
): Promise<Complaint> =>
    request<Complaint>("PATCH", `${API.COMPLAINTS}/${id}/assign`, {
        primaryAssigneeId,
        expectedCompletionDate,
        transferReason,
    });
