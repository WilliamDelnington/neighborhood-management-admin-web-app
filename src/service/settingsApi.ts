import { API } from "@constants/common";
import { request } from "./request";

export const fetchAllSettings = (): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>("GET", API.SETTINGS, { admin: 1 });

// Danh sach key duoc whitelist cong khai (xem PUBLIC_SETTING_KEYS o backend) -
// dung khi doc mot key cong khai ma khong can quyen admin, vd man quan ly thu
// tu tinh nang Mini App (chi can settings.read/settings.update de sua).
export const fetchPublicSettings = (): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>("GET", API.SETTINGS);

export const upsertSetting = (
    key: string,
    value: unknown,
    description?: string,
): Promise<unknown> =>
    request("POST", API.SETTINGS, { key, value, description });

// Logo ung dung (thay the chu "Quan ly To dan pho" tren header/trang dang
// nhap neu admin da tai anh len) - luu qua Setting key "app_logo_url", cong
// khai qua fetchPublicSettings() nen bat ky ai dang nhap (khong chi admin)
// deu thay duoc logo dung tren header cua ho.
export interface AppLogoSetting {
    key: string;
    value: string | null;
}

export const uploadAppLogo = (file: File): Promise<AppLogoSetting> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<AppLogoSetting>("POST", `${API.SETTINGS}/logo`, formData);
};

export const deleteAppLogo = (): Promise<AppLogoSetting> =>
    request<AppLogoSetting>("DELETE", `${API.SETTINGS}/logo`);
