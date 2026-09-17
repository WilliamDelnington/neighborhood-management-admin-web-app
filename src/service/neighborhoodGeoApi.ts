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
