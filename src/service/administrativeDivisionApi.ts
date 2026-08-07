import { API } from "@constants/common";
import { Province, Ward } from "@dts";
import { request } from "./request";

// Du lieu tinh/thanh pho + phuong/xa, proxy qua backend tu API cong khai
// https://provinces.open-api.vn (xem lib/administrativeDivisions.ts o
// backend). Cache lai trong bo nho phia client (module-level) vi day la du
// lieu gan nhu tinh, tranh goi lai moi lan mo form tao nha so.
let provincesCache: Promise<Province[]> | null = null;
const wardsCache = new Map<number, Promise<Ward[]>>();

export function fetchProvinces(): Promise<Province[]> {
    if (!provincesCache) {
        provincesCache = request<Province[]>(
            "GET",
            API.ADMINISTRATIVE_DIVISIONS_PROVINCES,
        ).catch(err => {
            provincesCache = null;
            throw err;
        });
    }
    return provincesCache;
}

export function fetchWardsByProvince(provinceCode: number): Promise<Ward[]> {
    let cached = wardsCache.get(provinceCode);
    if (!cached) {
        cached = request<Ward[]>(
            "GET",
            API.ADMINISTRATIVE_DIVISIONS_WARDS,
            { provinceCode },
        ).catch(err => {
            wardsCache.delete(provinceCode);
            throw err;
        });
        wardsCache.set(provinceCode, cached);
    }
    return cached;
}
