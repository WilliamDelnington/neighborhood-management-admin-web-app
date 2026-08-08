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
