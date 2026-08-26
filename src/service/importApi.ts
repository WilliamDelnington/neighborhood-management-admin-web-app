import { API, BASE_URL } from "@constants/common";
import { useAuthStore } from "@store/authStore";
import { request } from "./request";

export interface ImportRowError {
    row: number;
    message: string;
}

export interface StreetImportPreviewRow {
    name: string;
    code: string;
    active: boolean;
}

// Xem HOUSE_COLUMNS/applyHouseImportMapping o backend importService.ts -
// "address" duoc backend tu suy ra tu cot da mapping cho "Phân khu/dãy" +
// "Mã căn/hộ" (khong co cot dia chi rieng trong Phieu thu thap),
// "ownerName"/"ownerPhone" chi co gia tri khi ca hai hop le (se tao tai
// khoan chu nha luc commit).
export interface HouseImportPreviewRow {
    code: string;
    cluster: string;
    address: string;
    ownerName?: string;
    ownerPhone?: string;
    note?: string;
}

// Mapping cot Excel -> truong du lieu House, do nguoi dung xac nhan o buoc
// "chon cot" sau khi upload - chi "code" bat buoc, cac truong con lai tuy
// chon (bo trong = khong dung cot nao). defaultCluster/neighborhoodId KHONG
// phai cot trong file - la gia tri nhap/chon MOT LAN cho ca file, dung khi
// "subZone" khong duoc chon hoac o rong o mot so dong.
export interface HouseColumnMapping {
    code: string;
    subZone?: string;
    ownerName?: string;
    ownerPhone?: string;
    headOfHousehold?: string;
    contactPhone?: string;
    usageType?: string;
    residenceStatus?: string;
    hasBusiness?: string;
    memberCount?: string;
    landStatus?: string;
    lotCodeCrossCheck?: string;
    note?: string;
    defaultCluster?: string;
    neighborhoodId?: string;
}

export type ImportJobStatus =
    | "awaiting_mapping"
    | "previewing"
    | "validated"
    | "committed"
    | "failed";

// T = kieu tung dong trong previewData - moi loai import (street/house/...)
// co hinh dang rieng, xem StreetImportPreviewRow/HouseImportPreviewRow.
export interface ImportJob<T = StreetImportPreviewRow> {
    _id: string;
    type: string;
    status: ImportJobStatus;
    fileName: string;
    totalRows: number;
    validRows: number;
    headers: string[];
    suggestedMapping: Record<string, string>;
    columnMapping: Record<string, string>;
    rowErrors: ImportRowError[];
    previewData: T[];
    committedCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface StreetColumnMapping {
    name: string;
    code?: string;
    active?: string;
}

export const uploadStreetImportFile = (file: File): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportJob>("POST", `${API.IMPORT}/streets`, formData);
};

export const applyStreetImportMapping = (
    jobId: string,
    mapping: StreetColumnMapping,
): Promise<ImportJob> =>
    request<ImportJob>(
        "PUT",
        `${API.IMPORT}/streets/${jobId}/mapping`,
        mapping,
    );

export const commitStreetImport = (jobId: string): Promise<ImportJob> =>
    request<ImportJob>("POST", `${API.IMPORT}/streets/${jobId}/commit`);

export const uploadHouseImportFile = (
    file: File,
): Promise<ImportJob<HouseImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportJob<HouseImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/houses`,
        formData,
    );
};

export const applyHouseImportMapping = (
    jobId: string,
    mapping: HouseColumnMapping,
): Promise<ImportJob<HouseImportPreviewRow>> =>
    request<ImportJob<HouseImportPreviewRow>>(
        "PUT",
        `${API.IMPORT}/houses/${jobId}/mapping`,
        mapping,
    );

export const commitHouseImport = (
    jobId: string,
): Promise<ImportJob<HouseImportPreviewRow>> =>
    request<ImportJob<HouseImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/houses/${jobId}/commit`,
    );

/**
 * File .xlsx nhi phan, khong theo envelope JSON chuan - khong dung request(),
 * mo truc tiep bang token qua fetch + tao link tai xuong tam thoi (giong
 * downloadReportExcel o reportApi.ts).
 */
export const downloadStreetImportTemplate = async (): Promise<void> => {
    const { token } = useAuthStore.getState();
    const url = new URL(`${API.IMPORT}/streets/template`, BASE_URL);

    const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
        throw new Error("Không thể tải mẫu Excel");
    }
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "mau-nhap-duong-pho.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
};
