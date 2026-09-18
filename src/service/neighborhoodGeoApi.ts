import { API } from "@constants/common";
import { request } from "./request";

/**
 * Proxy Goong Place Autocomplete/Place Detail qua backend (khoa API chi ton
 * tai o server, xem lib/integrations/goong.ts) - dung cho o tim kiem dia chi
 * tren widget "Bản đồ ranh giới Tổ dân phố" o Dashboard. Khac
 * houseApi/geo tuong tu (gioi han quyen Nha so): 2 endpoint nay chi can
 * neighborhoods.read, vi widget ban do hien voi nhieu vai tro xem Dashboard.
 */

export interface GeoAutocompletePrediction {
    placeId: string;
    text: string;
    mainText: string;
    secondaryText: string;
}

export const autocompleteNeighborhoodPlaces = (
    input: string,
    sessionToken: string,
): Promise<GeoAutocompletePrediction[]> =>
    request<GeoAutocompletePrediction[]>(
        "POST",
        API.NEIGHBORHOODS_GEO_AUTOCOMPLETE,
        { input, sessionToken },
    );

export interface GeoPlaceDetails {
    lat: number;
    lng: number;
    formattedAddress: string;
}

export const fetchNeighborhoodPlaceDetails = (
    placeId: string,
    sessionToken: string,
): Promise<GeoPlaceDetails> =>
    request<GeoPlaceDetails>("POST", API.NEIGHBORHOODS_GEO_PLACE_DETAILS, {
        placeId,
        sessionToken,
    });

export interface CategoryPlaceResult {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

export interface LatLngBounds {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
}

// Xap xi "bản đồ tiện ích" (UBND/Công an/Trường học/Chung cư...) - Goong khong
// co API tim theo danh muc that (xem lib/integrations/goong.ts o backend), nen
// chat luong/so luong ket qua bi gioi han theo Autocomplete. `bounds` (truyen
// bbox Phuong, xem WARD_MAX_BOUNDS trong NeighborhoodZonesMap.tsx) loai bo ket
// qua "bay ra ngoai" khu vuc quan ly - location cua Goong chi uu tien xep
// hang, khong phai bo loc ban kinh cung.
export const searchNeighborhoodPlacesByCategory = (
    keyword: string,
    center: { lat: number; lng: number },
    bounds?: LatLngBounds,
): Promise<CategoryPlaceResult[]> =>
    request<CategoryPlaceResult[]>(
        "POST",
        `${API.NEIGHBORHOODS}/geo/category-search`,
        { keyword, lat: center.lat, lng: center.lng, bounds },
    );
