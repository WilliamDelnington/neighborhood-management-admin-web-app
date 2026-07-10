import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    Complaint,
    ComplaintDetail,
    NhomPhanAnh,
    PaginatedData,
    TrangThaiPhanAnh,
} from "@dts";
import { request } from "./request";

export const fetchComplaints = (params?: {
    page?: number;
    limit?: number;
    status?: TrangThaiPhanAnh;
    category?: NhomPhanAnh;
    search?: string;
}): Promise<PaginatedData<Complaint>> =>
    request<PaginatedData<Complaint>>("GET", API.COMPLAINTS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        status: params?.status,
        category: params?.category,
        search: params?.search,
    });

export const fetchComplaintDetail = (id: string): Promise<ComplaintDetail> =>
    request<ComplaintDetail>("GET", `${API.COMPLAINTS}/${id}`);

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
    assigneeId: string,
    expectedCompletionDate?: string,
): Promise<Complaint> =>
    request<Complaint>("PATCH", `${API.COMPLAINTS}/${id}/assign`, {
        assigneeId,
        expectedCompletionDate,
    });
