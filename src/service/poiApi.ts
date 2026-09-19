import { API, BASE_URL } from "@constants/common";
import { PoiCategory } from "@dts";
import { useAuthStore } from "@store/authStore";
import { request } from "./request";

// Tom tat Household duoc backend populate san khi category = "household" (xem
// HOUSEHOLD_POPUP_FIELDS trong poiService.ts) - vua du de hien popup, khong
// phai goi them fetchHouseholdById.
export interface PoiHouseholdSummary {
    _id: string;
    code: string;
    headOfHousehold: string;
    phone?: string;
    address: string;
    status: string;
}

export interface Poi {
    _id: string;
    name: string;
    category: PoiCategory;
    lat: number;
    lng: number;
    address?: string;
    verified: boolean;
    source: "manual" | "scan";
    // Chi co gia tri (da populate) khi category = "household".
    householdId?: PoiHouseholdSummary | string | null;
    createdAt: string;
    updatedAt: string;
}

export const fetchPois = (params?: {
    category?: PoiCategory;
    verified?: boolean;
}): Promise<Poi[]> => request<Poi[]>("GET", API.POIS, params);

export interface PoiInput {
    name: string;
    category: PoiCategory;
    lat: number;
    lng: number;
    address?: string;
    verified?: boolean;
    // Bat buoc khi category = "household".
    householdId?: string;
}

export const createPoi = (input: PoiInput): Promise<Poi> =>
    request<Poi>("POST", API.POIS, input);

export const updatePoi = (id: string, input: Partial<PoiInput>): Promise<Poi> =>
    request<Poi>("PATCH", `${API.POIS}/${id}`, input);

export const deletePoi = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.POIS}/${id}`);

export interface ScanPoisResult {
    category: PoiCategory;
    label: string;
    created: number;
    skippedExisting: number;
}

export const scanPois = (): Promise<ScanPoisResult[]> =>
    request<ScanPoisResult[]>("POST", `${API.POIS}/scan`);

/**
 * File .xlsx nhi phan, khong theo envelope JSON chuan - khong dung request(),
 * mo truc tiep bang token qua fetch + tao link tai xuong tam thoi (giong
 * downloadImportTemplate o importApi.ts).
 */
export const downloadPoisExcel = async (): Promise<void> => {
    const { token } = useAuthStore.getState();
    const url = new URL(`${API.EXPORT}/pois`, BASE_URL);

    const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
        throw new Error("Không thể xuất file Excel");
    }
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "danh-sach-diem-tien-ich.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
};
