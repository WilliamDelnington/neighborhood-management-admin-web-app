import { API } from "@constants/common";
import {
    Business,
    BusinessDocument,
    BusinessStatus,
    FileAsset,
    PaginatedData,
    RequiredDocumentsResult,
} from "@dts";
import { request } from "./request";

export interface BusinessInput {
    name: string;
    houseId: string;
    // id BusinessType, hoac null de bo chon.
    businessType?: string | null;
    ownerName?: string;
    phone?: string;
    active?: boolean;
    note?: string;
}

export const fetchBusinesses = (params?: {
    search?: string;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<Business>> =>
    request<PaginatedData<Business>>("GET", API.BUSINESSES, params);

export const fetchBusinessById = (id: string): Promise<Business> =>
    request<Business>("GET", `${API.BUSINESSES}/${id}`);

export const createBusiness = (input: BusinessInput): Promise<Business> =>
    request<Business>("POST", API.BUSINESSES, input);

export const updateBusiness = (
    id: string,
    input: Partial<Omit<BusinessInput, "houseId">>,
): Promise<Business> =>
    request<Business>("PATCH", `${API.BUSINESSES}/${id}`, input);

export const deleteBusiness = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.BUSINESSES}/${id}`);

// Ghi de thu cong - CHI danh cho admin (xem PATCH /api/businesses/:id/status
// o backend). Luong binh thuong dung reviewBusinessDocument ben duoi, trang
// thai duoc backend tu tinh lai.
export const updateBusinessStatus = (
    id: string,
    status: BusinessStatus,
): Promise<Business> =>
    request<Business>("PATCH", `${API.BUSINESSES}/${id}/status`, { status });

export const fetchBusinessAttachments = (id: string): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.BUSINESSES}/${id}/attachments`);

export const deleteBusinessAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>("DELETE", `${API.BUSINESSES}/${id}/attachments/${fileId}`);

export const fetchRequiredDocuments = (
    businessId: string,
): Promise<RequiredDocumentsResult> =>
    request<RequiredDocumentsResult>(
        "GET",
        `${API.BUSINESSES}/${businessId}/required-documents`,
    );

export const reviewBusinessDocument = (
    businessId: string,
    documentId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string,
): Promise<BusinessDocument> =>
    request<BusinessDocument>(
        "PUT",
        `${API.BUSINESSES}/${businessId}/documents/${documentId}/review`,
        { decision, rejectionReason },
    );
