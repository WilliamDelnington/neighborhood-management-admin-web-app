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

// Nhan vien tu tiep nhan mot phan anh dang "moi_tiep_nhan" - tro thanh nguoi
// phu trach chinh CUA CHINH MINH. Khac assignComplaint (chon/doi nguoi phu
// trach cho NGUOI KHAC, dung de tai phan cong sau nay).
export const receiveComplaint = (id: string): Promise<Complaint> =>
    request<Complaint>("POST", `${API.COMPLAINTS}/${id}/receive`);

// Nhan vien chon MOT nguoi khac lam nguoi phu trach chinh cho mot phan anh
// dang "moi_tiep_nhan" - khac receiveComplaint (tu tiep nhan) va
// assignComplaint (tai phan cong/chuyen trach nhiem sau buoc tiep nhan dau
// tien).
export const choosePersonInCharge = (
    id: string,
    userId: string,
): Promise<Complaint> =>
    request<Complaint>("POST", `${API.COMPLAINTS}/${id}/choose-assignee`, {
        userId,
    });

// Yeu cau nguoi gui bo sung thong tin cho mot phan anh dang "moi_tiep_nhan" -
// chuyen phan anh sang "can_bo_sung", nguoi gui tu sua phan anh de bo sung.
export const requestComplaintInfo = (
    id: string,
    content: string,
): Promise<Complaint> =>
    request<Complaint>("POST", `${API.COMPLAINTS}/${id}/request-info`, {
        content,
    });
