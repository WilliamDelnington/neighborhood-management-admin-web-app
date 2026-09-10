import { API } from "@constants/common";
import { Citizen, GioiTinh, LoaiCuTru, PaginatedData } from "@dts";
import { request } from "./request";

export interface CitizenInput {
    fullName: string;
    phone?: string;
    cccd?: string;
    birthDate?: string;
    gender?: GioiTinh;
    relationToHead?: string;
    occupation?: string;
    householdId: string;
    residenceType?: LoaiCuTru;
    temporaryResidenceStartsAt?: string;
    temporaryResidenceExpiresAt?: string;
    isResidencyDeclared?: boolean;
    isElderly?: boolean;
    isChild?: boolean;
    isDisabledOrSupportNeeded?: boolean;
    isDisabledChild?: boolean;
    isPartyMember?: boolean;
    isUnionMember?: boolean;
    isMartyr?: boolean;
    isMartyrFamily?: boolean;
    isVeteran?: boolean;
    isOtherSpecial?: boolean;
    otherSpecialLabel?: string;
}

export const fetchCitizens = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    householdId?: string;
    neighborhoodId?: string;
}): Promise<PaginatedData<Citizen>> =>
    request<PaginatedData<Citizen>>("GET", API.CITIZENS, params);

// Khong co endpoint rieng tra ve toan bo nhan khau (fetchCitizens luon phan
// trang) - dung cho man hinh Xuat bao cao (ExportReportListPage.tsx) can loc
// tren toan bo danh sach nhan khau (vd theo gioi tinh/do tuoi) truoc khi xuat
// file, nen phai duyet qua tung trang voi limit lon roi gop lai.
export const fetchAllCitizens = async (params?: {
    search?: string;
    householdId?: string;
    neighborhoodId?: string;
}): Promise<Citizen[]> => {
    const limit = 500;
    let page = 1;
    const all: Citizen[] = [];
    for (;;) {
        const res = await fetchCitizens({ ...params, page, limit });
        all.push(...res.items);
        if (page >= res.totalPages || res.items.length === 0) break;
        page += 1;
    }
    return all;
};

export const fetchCitizenById = (id: string): Promise<Citizen> =>
    request<Citizen>("GET", `${API.CITIZENS}/${id}`);

export const createCitizen = (input: CitizenInput): Promise<Citizen> =>
    request<Citizen>("POST", API.CITIZENS, input);

export const updateCitizen = (
    id: string,
    input: Partial<CitizenInput>,
): Promise<Citizen> =>
    request<Citizen>("PATCH", `${API.CITIZENS}/${id}`, input);

export const deleteCitizen = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.CITIZENS}/${id}`);
