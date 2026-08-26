import { API } from "@constants/common";
import {
    AuditLogRecord,
    EntityRequiredDocumentsResult,
    FileAsset,
    House,
    HouseGisSource,
    HousePhysicalStatus,
    HouseStatus,
    HouseUsageType,
    PaginatedData,
    RequiredDocumentRecord,
    RequiredDocumentRule,
} from "@dts";
import { request } from "./request";
import {
    fetchEntityRequiredDocuments,
    fetchRequiredDocumentRules,
    putRequiredDocumentRules,
    RequiredDocumentRuleInput,
    reviewEntityDocument,
} from "./requiredDocumentApi";

export interface HouseOwnerPersonInput {
    displayName: string;
    phone: string;
    email?: string;
    // TAM THOI: cho phep nhan vien dat mat khau luc tao tai khoan thay (thay
    // OTP, hien chua san sang do can duyet mau tin truoc - xem LoginPage.tsx
    // o mini app). Chi ap dung khi tao tai khoan MOI (bo qua neu so dien
    // thoai da co tai khoan san).
    password?: string;
}

export interface HouseOwnerOrganizationInput {
    name: string;
    taxCode?: string;
    organizationType?: string;
    address?: string;
    phone?: string;
    email?: string;
}

export interface HouseInput {
    cluster?: string;
    streetId?: string;
    neighborhoodId?: string | null;
    address: string;
    // Phuong/xa va tinh/thanh pho - hien thi dia chi day du, khong bat buoc va
    // khong gan voi RBAC/pham vi nao (xem administrativeDivisionApi.ts).
    provinceCode?: number;
    provinceName?: string;
    wardCode?: number;
    wardName?: string;
    physicalStatus?: HousePhysicalStatus;
    usageTypes?: HouseUsageType[];
    otherUsageNote?: string;
    note?: string;
    gisLatitude?: number | null;
    gisLongitude?: number | null;
    gisAccuracyMeters?: number | null;
    gisSource?: HouseGisSource;
    gisCapturedAt?: string | null;
    // Loai chu nha duoc khai bao luc tao nha so - xem HouseForm.tsx. "none" =
    // chua khai bao (hanh vi cu khi khong nhap gi ca).
    ownerKind?: "individual" | "organization" | "none";
    // ownerKind="individual": luon gui kem du co tao tai khoan hay khong.
    owner?: HouseOwnerPersonInput;
    // true = tao tai khoan User dang nhap duoc cho chu nha; false/khong co =
    // chi luu lai thanh danh tinh khai bao (Person), khong dang nhap duoc.
    createOwnerAccount?: boolean;
    // ownerKind="organization": to chuc duoc khai bao inline (tim-hoac-tao
    // theo taxCode o backend), luon gui kem.
    organization?: HouseOwnerOrganizationInput;
    // true = tao them tai khoan User cho nguoi dai dien to chuc (kem
    // `representative`) - chi co hieu luc neu to chuc duoc TAO MOI trong lan
    // goi nay (to chuc da ton tai theo taxCode se giu nguyen nguoi dai dien).
    createRepresentativeAccount?: boolean;
    representative?: HouseOwnerPersonInput;
}

export interface OwnerPhoneCheckResult {
    exists: boolean;
    displayName?: string;
}

// Kiem tra so dien thoai chu nha/nguoi dai dien da co tai khoan chua - dung de
// canh bao ngay tren HouseForm.tsx truoc khi nop (xem checkOwnerPhoneExists o
// backend). Nem loi neu so dien thoai chua du dinh dang hop le.
export const checkOwnerPhone = (phone: string): Promise<OwnerPhoneCheckResult> =>
    request<OwnerPhoneCheckResult>("GET", API.HOUSES_CHECK_OWNER_PHONE, { phone });

export const fetchHouses = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cluster?: string;
    streetId?: string;
    neighborhoodId?: string;
    wardCode?: number;
    status?: string;
}): Promise<PaginatedData<House>> =>
    request<PaginatedData<House>>("GET", API.HOUSES, params);

export const fetchHouseById = (id: string): Promise<House> =>
    request<House>("GET", `${API.HOUSES}/${id}`);

export const fetchHouseHouseholds = (
    id: string,
    params?: { page?: number; limit?: number; search?: string },
) => request("GET", `${API.HOUSES}/${id}/households`, params);

export const fetchHouseBusinesses = (
    id: string,
    params?: { page?: number; limit?: number },
) => request("GET", `${API.HOUSES}/${id}/businesses`, params);

export const fetchHouseCompanies = (
    id: string,
    params?: { page?: number; limit?: number },
) => request("GET", `${API.HOUSES}/${id}/companies`, params);

export const createHouse = (input: HouseInput): Promise<House> =>
    request<House>("POST", API.HOUSES, input);

export const updateHouse = (
    id: string,
    input: Partial<HouseInput>,
): Promise<House> => request<House>("PATCH", `${API.HOUSES}/${id}`, input);

export const updateHouseGis = (
    id: string,
    input: {
        gisLatitude: number | null;
        gisLongitude: number | null;
        gisAccuracyMeters?: number | null;
        gisSource?: HouseGisSource;
        gisCapturedAt?: string | null;
    },
): Promise<House> =>
    request<House>("PATCH", `${API.HOUSES}/${id}/gis`, input);

export const deleteHouse = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.HOUSES}/${id}`);

export interface HouseGisOverviewPoint {
    houseId: string;
    code: string;
    address: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
}

export interface HouseGisOverview {
    scopeLabel: string;
    totalHouses: number;
    housesWithCoordinates: number;
    points: HouseGisOverviewPoint[];
}

/**
 * Chi 1 request backend (khong ton chi phi Google) - dung cho ca so lieu
 * thong ke "N/M nha co toa do" (tai ngay khi vao trang) va danh sach diem cho
 * ban do tong hop (chi ve khi bam "Xem bản đồ" - xem HouseMapPanel.tsx).
 */
export const fetchHouseGisOverview = (): Promise<HouseGisOverview> =>
    request<HouseGisOverview>("GET", API.HOUSES_GIS_OVERVIEW);

export const updateHouseStatus = (
    id: string,
    status: HouseStatus,
    note?: string,
): Promise<House> =>
    request<House>("PATCH", `${API.HOUSES}/${id}/status`, { status, note });

// Ket qua thao tac hang loat - moi nha duoc xu ly RIENG o backend (khong loi
// nao lam dung ca lo), nen ket qua tra ve id nao thanh cong/that bai kem ly
// do, thay vi chi mot true/false chung.
export interface BulkHouseActionResult {
    succeededIds: string[];
    failed: { id: string; message: string }[];
}

// Gan mot to dan pho cho nhieu nha so cung luc (vd nha nhap tu Excel con
// thieu to dan pho) - nha da "verified" se rot vao "failed" (phai di qua yeu
// cau thay doi thong tin), xem houseRecordService.bulkAssignHouseNeighborhood
// o backend.
export const bulkAssignHouseNeighborhood = (
    ids: string[],
    neighborhoodId: string,
): Promise<BulkHouseActionResult> =>
    request<BulkHouseActionResult>("PATCH", API.HOUSES_BULK_NEIGHBORHOOD, {
        ids,
        neighborhoodId,
    });

// Duyet/tu choi/yeu cau cap nhat hang loat (vd duyet nhanh cac nha dang "Chờ
// duyệt") - nha khong o dung trang thai nguon se rot vao "failed", xem
// houseRecordService.bulkTransitionHouseRecordStatus o backend.
export const bulkUpdateHouseStatus = (
    ids: string[],
    status: HouseStatus,
    note?: string,
): Promise<BulkHouseActionResult> =>
    request<BulkHouseActionResult>("PATCH", API.HOUSES_BULK_STATUS, {
        ids,
        status,
        note,
    });

export const fetchHouseAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.HOUSES}/${id}/audit-logs`,
        params,
    );

export const fetchHouseAttachments = (id: string): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.HOUSES}/${id}/attachments`);

export const deleteHouseAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>("DELETE", `${API.HOUSES}/${id}/attachments/${fileId}`);

export const fetchHouseRequiredDocuments = (
    id: string,
): Promise<EntityRequiredDocumentsResult> =>
    fetchEntityRequiredDocuments(API.HOUSES, id);

/** Dong luat giay to bat buoc AP DUNG CHUNG cho toan bo nha so (khong phai mot nha cu the). */
export const fetchHouseRequiredDocumentRules = (): Promise<{
    requiredDocuments: RequiredDocumentRule[];
}> => fetchRequiredDocumentRules(API.HOUSES);

export const putHouseRequiredDocumentRules = (
    requiredDocuments: RequiredDocumentRuleInput[],
): Promise<{ requiredDocuments: RequiredDocumentRule[] }> =>
    putRequiredDocumentRules(API.HOUSES, requiredDocuments);

export const reviewHouseDocument = (
    id: string,
    documentId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string,
    approvalNote?: string,
): Promise<RequiredDocumentRecord> =>
    reviewEntityDocument(
        API.HOUSES,
        id,
        documentId,
        decision,
        rejectionReason,
        approvalNote,
    );
