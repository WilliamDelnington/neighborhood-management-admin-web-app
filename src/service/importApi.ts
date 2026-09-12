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

// Xem HOUSEHOLD_COLUMNS/previewHouseholdImport o backend importService.ts -
// khac House/Citizen/Street/Business, luong nay CHUA co buoc "chon cot": ten
// cot trong file phai khop voi HOUSEHOLD_COLUMNS (xem
// downloadHouseholdImportTemplate). Commit se tu tao them 1 Citizen "Chủ hộ"
// cho moi hang dan moi (giong processHouseImportRows), khong can nguoi dung
// khai bao rieng.
export interface HouseholdImportPreviewRow {
    cluster: string;
    address: string;
    headOfHousehold: string;
    phone?: string;
    ownershipType: string;
    needsSupport: boolean;
    note?: string;
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
    // KHONG phai cot trong file - admin nhap MOT LAN cho ca file. Khi co, moi
    // tai khoan chu nha MOI tao trong lan import nay duoc dat mat khau nay,
    // va bat buoc doi mat khau ngay lan dang nhap dau tien (xem
    // User.mustChangePassword o backend).
    defaultPassword?: string;
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
    occupation?: string;
    householdId?: string;
    residenceType: string;
    temporaryResidenceStartsAt?: string;
    temporaryResidenceExpiresAt?: string;
    isResidencyDeclared: boolean;
    isUnemployed: boolean;
    isElderly: boolean;
    isChild: boolean;
    isDisabledOrSupportNeeded: boolean;
    isDisabledChild: boolean;
    isPartyMember: boolean;
    isUnionMember: boolean;
    isMartyr: boolean;
    isMartyrFamily: boolean;
    isVeteran: boolean;
    isOtherSpecial: boolean;
    otherSpecialLabel?: string;
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
    occupation?: string;
    householdCode?: string;
    houseCode?: string;
    residenceType?: string;
    temporaryResidenceStartsAt?: string;
    temporaryResidenceExpiresAt?: string;
    isResidencyDeclared?: string;
    isUnemployed?: string;
    isElderly?: string;
    isChild?: string;
    isDisabledOrSupportNeeded?: string;
    isDisabledChild?: string;
    isPartyMember?: string;
    isUnionMember?: string;
    isMartyr?: string;
    isMartyrFamily?: string;
    isVeteran?: string;
    isOtherSpecial?: string;
    otherSpecialLabel?: string;
}

export type ImportJobStatus =
    | "awaiting_mapping"
    | "previewing"
    | "validated"
    | "committing"
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
    // Tat ca ten sheet co trong file da upload (khong chi sheet duoc doc) -
    // dung de hien thi/chon lai sheet khi file co nhieu hon 1 sheet (xem
    // sourceSheetName va uploadXImportFile(file, sheetName)).
    availableSheetNames: string[];
    // Ten sheet THUC SU da duoc doc de tao headers/previewData o tren - mac
    // dinh la sheet dau tien trong file neu khong chi dinh sheetName luc
    // upload.
    sourceSheetName: string;
    suggestedMapping: Record<string, string>;
    columnMapping: Record<string, string>;
    // Loi that su (thieu du lieu, gia tri khong hop le, khong doi chieu duoc)
    // - cac dong nay se KHONG duoc nhap. Khac skippedRows: dong loi van duoc
    // hien thi/xuat ra Excel de nguoi dung sua lai va nhap lai lan sau.
    rowErrors: ImportRowError[];
    // Dong da nhan dien "du lieu da ton tai" (trung ten/ma/cccd... voi du lieu
    // co san) - khong bi coi la loi, chi don gian la bi bo qua (khong tao
    // trung). Hien thi rieng voi rowErrors o giao dien.
    skippedRows: ImportRowError[];
    previewData: T[];
    committedCount: number;
    // Chi co y nghia trong/sau luc commit (status="committing"/"committed") -
    // xem ghi chu tuong ung o backend IImportJob.
    createdCount: number;
    skippedCount: number;
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

export const uploadHouseholdImportFile = (
    file: File,
    sheetName?: string,
): Promise<ImportJob<HouseholdImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) formData.append("sheetName", sheetName);
    return request<ImportJob<HouseholdImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/households`,
        formData,
    );
};

export const commitHouseholdImport = (
    jobId: string,
): Promise<ImportJob<HouseholdImportPreviewRow>> =>
    request<ImportJob<HouseholdImportPreviewRow>>(
        "POST",
        `${API.IMPORT}/households/${jobId}/commit`,
    );

export const uploadStreetImportFile = (
    file: File,
    sheetName?: string,
): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) formData.append("sheetName", sheetName);
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
    sheetName?: string,
): Promise<ImportJob<HouseImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) formData.append("sheetName", sheetName);
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
    sheetName?: string,
): Promise<ImportJob<BusinessImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) formData.append("sheetName", sheetName);
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
    sheetName?: string,
): Promise<ImportJob<CitizenImportPreviewRow>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) formData.append("sheetName", sheetName);
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

export const fetchImportJob = <T = StreetImportPreviewRow>(
    jobId: string,
): Promise<ImportJob<T>> =>
    request<ImportJob<T>>("GET", `${API.IMPORT}/jobs/${jobId}`);

/**
 * Sau khi goi commitXImport, job chuyen sang "committing" va viec ghi du lieu
 * thuc su (co the nhieu tram/nghin dong) chay o background tren server (xem
 * processXImportRows o importService.ts) - ham nay poll
 * GET /api/import/jobs/:id moi `intervalMs` cho den khi job khong con
 * "committing" nua (thanh "committed" hoac "failed"), goi `onProgress` sau
 * moi lan poll de component cap nhat thanh tien do (vd progress bar theo
 * committedCount/totalRows).
 */
export const pollImportJobUntilSettled = async <T = StreetImportPreviewRow>(
    jobId: string,
    onProgress?: (job: ImportJob<T>) => void,
    intervalMs = 800,
): Promise<ImportJob<T>> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const job = await fetchImportJob<T>(jobId);
        onProgress?.(job);
        if (job.status !== "committing") return job;
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => {
            setTimeout(resolve, intervalMs);
        });
    }
};

/**
 * File .xlsx nhi phan, khong theo envelope JSON chuan - khong dung request(),
 * mo truc tiep bang token qua fetch + tao link tai xuong tam thoi (giong
 * downloadReportExcel o reportApi.ts).
 */
const downloadImportTemplate = async (
    path: string,
    filename: string,
): Promise<void> => {
    const { token } = useAuthStore.getState();
    const url = new URL(path, BASE_URL);

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
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
};

export const downloadStreetImportTemplate = (): Promise<void> =>
    downloadImportTemplate(
        `${API.IMPORT}/streets/template`,
        "mau-nhap-duong-pho.xlsx",
    );

export const downloadHouseholdImportTemplate = (): Promise<void> =>
    downloadImportTemplate(
        `${API.IMPORT}/households/template`,
        "mau-nhap-ho-dan.xlsx",
    );

export const downloadHouseImportTemplate = (): Promise<void> =>
    downloadImportTemplate(
        `${API.IMPORT}/houses/template`,
        "mau-nhap-nha-so.xlsx",
    );

export const downloadCitizenImportTemplate = (): Promise<void> =>
    downloadImportTemplate(
        `${API.IMPORT}/citizens/template`,
        "mau-nhap-nhan-khau.xlsx",
    );

export const downloadBusinessImportTemplate = (): Promise<void> =>
    downloadImportTemplate(
        `${API.IMPORT}/businesses/template`,
        "mau-nhap-ho-kinh-doanh.xlsx",
    );

/**
 * Xuat toan bo rowErrors cua mot import job ra file Excel (dung chung cho ca
 * 5 loai import - xem buildImportErrorsWorkbook o backend). filename nen dat
 * theo loai import de nguoi dung de phan biet khi tai nhieu file.
 */
export const downloadImportJobErrors = (
    jobId: string,
    filename: string,
): Promise<void> =>
    downloadImportTemplate(`${API.IMPORT}/jobs/${jobId}/errors/export`, filename);
