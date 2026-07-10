import { API } from "@constants/common";
import { request } from "./request";

export const fetchAllSettings = (): Promise<Record<string, unknown>> =>
    request<Record<string, unknown>>("GET", API.SETTINGS, { admin: 1 });

export const upsertSetting = (
    key: string,
    value: unknown,
    description?: string,
): Promise<unknown> =>
    request("POST", API.SETTINGS, { key, value, description });
