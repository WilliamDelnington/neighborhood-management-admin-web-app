import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    Complaint,
    ComplaintDetail,
    EmergencyComplaintGisOverview,
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
    neighborhoodId?: string;
    // Chi co y nghia voi To truong/To pho - "received" (mac dinh, khong can
    // truyen) = phan anh cua cu dan trong To, "sent" = de xuat chinh ho da
    // gui len Phuong. Vai tro khac bo qua tham so nay (xem listComplaints o
    // backend).
    view?: "sent";
}): Promise<PaginatedData<Complaint>> =>
    request<PaginatedData<Complaint>>("GET", API.COMPLAINTS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        status: params?.status,
        category: params?.category,
        search: params?.search,
        relatedAssetId: params?.relatedAssetId,
        neighborhoodId: params?.neighborhoodId,
        view: params?.view,
    });

export const fetchComplaintDetail = (id: string): Promise<ComplaintDetail> =>
    request<ComplaintDetail>("GET", `${API.COMPLAINTS}/${id}`);

// Marker "khan cap" tren trang Ban do - xem EmergencyComplaintGisPoint (@dts).
export const fetchEmergencyComplaintGisOverview =
    (): Promise<EmergencyComplaintGisOverview> =>
        request<EmergencyComplaintGisOverview>(
            "GET",
            `${API.COMPLAINTS}/emergency-gis`,
        );

// Gui phan anh moi tu admin-web-app - truoc day chi thuc hien duoc tu ung
// dung Zalo/resident-web-app (cu dan); nay mo them cho To truong/To pho gui
// de xuat/phan anh len Phuong (xem allowedSenderRoles o backend).
export interface CreateComplaintParams {
    category: string;
    title: string;
    content: string;
    houseId?: string;
    area?: string;
}

export const createComplaint = (
    input: CreateComplaintParams,
): Promise<Complaint> => request<Complaint>("POST", API.COMPLAINTS, input);

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
