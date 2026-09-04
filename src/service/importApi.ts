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
// khoan chu nha luc commit). "existingHouseId" co gia tri khi "Mã căn/hộ" cua
// dong nay DA TON TAI trong he thong - dong do se duoc COMMIT nhu mot lan
// "cập nhật" (chi dien vao truong dang trong tren House/Household da co,
// khong tao trung/ghi de - xem mergeIntoExistingHouse o backend) thay vi tao
// moi; cluster/address luc do khong duoc dung nen co the rong.
export interface HouseImportPreviewRow {
    code: string;
    cluster?: string;
    address?: string;
    existingHouseId?: string;
    ownerName?: string;
    ownerPhone?: string;
    note?: string;
    // Chi duoc DUNG khi mapping.createHouseholds=true (xem commitHouseImport
    // o backend) - van duoc backend tinh san trong moi truong hop de hien thi
    // truoc ("preview") cho nguoi dung xem se dien gi vao Household, du co
    // bat tuy chon hay chua.
    householdHeadOfHousehold?: string;
    householdPhone?: string;
    hasBusinessSignal?: boolean;
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
    // KHONG phai cot trong file - tick chon MOT LAN cho ca file. Khi bat, moi
    // dong CO ten chu ho se duoc tao them mot Household lien ket qua houseId
    // (xem ghi chu chi tiet o commitHouseImport backend) - mac dinh TAT.
    createHouseholds?: boolean;
}

// Xem BUSINESS_COLUMNS/applyBusinessImportMapping o backend importService.ts -
// "houseId" duoc backend tu doi chieu tu cot "Mã nhà" voi HouseRecord da ton
// tai (khong tu tao nha moi nhu House import), "businessTypeId" duoc doi
// chieu tu cot "Loại hình kinh doanh" (neu co chon cot va co gia tri).
export interface BusinessImportPreviewRow {
    name: string;
    houseCode: string;
    houseId: string;
    businessTypeId?: string;
    businessTypeName?: string;
    ownerName?: string;
    taxCode?: string;
    phone?: string;
    active: boolean;
    note?: string;
}

export interface CitizenImportPreviewRow {
    fullName: string;
    phone?: string;
    cccd?: string;
    birthDate?: string;
    gender: string;
    relationToHead?: string;
    householdId?: string;
    residenceType: string;
    isElderly: boolean;
    isChild: boolean;
    isDisabledOrSupportNeeded: boolean;
    isPartyMember: boolean;
    isUnionMember: boolean;
}

// Mapping cot Excel -> truong du lieu Citizen (nhan khau), do nguoi dung xac
// nhan o buoc "chon cot" sau khi upload - "fullName" bat buoc, va PHAI chon
// it nhat MOT trong "householdCode"/"houseCode" de lien ket toi ho dan (xem
// citizenImportMappingSchema/applyCitizenImportMapping o backend) -
// "houseCode" ("Mã căn/hộ") danh cho file chi ghi ma nha, khong co ma ho
// rieng - he thong se tu tim ho dan DANG lien ket voi nha do.
export interface CitizenColumnMapping {
    fullName: string;
    phone?: string;
    cccd?: string;
    birthDate?: string;
    gender?: string;
    relationToHead?: string;
    householdCode?: string;
    houseCode?: string;
    residenceType?: string;
    isElderly?: string;
    isChild?: string;
    isDisabledOrSupportNeeded?: string;
    isPartyMember?: string;
    isUnionMember?: string;
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

// Mapping cot Excel -> truong du lieu Business (ho kinh doanh), do nguoi
// dung xac nhan o buoc "chon cot" sau khi upload - "name"/"houseCode" bat
// buoc, cac truong con lai tuy chon (bo trong = khong dung cot nao).
export interface BusinessColumnMapping {
    name: string;
    houseCode: string;
    businessTypeName?: string;
    ownerName?: string;
    taxCode?: string;
    phone?: string;
    active?: string;
    note?: string;
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

export const uploadBusinessImportFile = (
    file: File,
): Promise<ImportJob<BusinessImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportJob<BusinessImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/businesses`,
        formData,
    );
};

export const applyBusinessImportMapping = (
    jobId: string,
    mapping: BusinessColumnMapping,
): Promise<ImportJob<BusinessImportPreviewRow>> =>
    request<ImportJob<BusinessImportPreviewRow>>(
        "PUT",
        `${API.IMPORT}/businesses/${jobId}/mapping`,
        mapping,
    );

export const commitBusinessImport = (
    jobId: string,
): Promise<ImportJob<BusinessImportPreviewRow>> =>
    request<ImportJob<BusinessImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/businesses/${jobId}/commit`,
    );

export const uploadCitizenImportFile = (
    file: File,
): Promise<ImportJob<CitizenImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportJob<CitizenImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/citizens`,
        formData,
    );
};

export const applyCitizenImportMapping = (
    jobId: string,
    mapping: CitizenColumnMapping,
): Promise<ImportJob<CitizenImportPreviewRow>> =>
    request<ImportJob<CitizenImportPreviewRow>>(
        "PUT",
        `${API.IMPORT}/citizens/${jobId}/mapping`,
        mapping,
    );

export const commitCitizenImport = (
    jobId: string,
): Promise<ImportJob<CitizenImportPreviewRow>> =>
    request<ImportJob<CitizenImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/citizens/${jobId}/commit`,
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
