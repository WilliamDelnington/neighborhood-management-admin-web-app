import { API } from "@constants/common";
import { request } from "./request";

export type GlobalSearchResultType =
    | "house"
    | "household"
    | "business"
    | "company"
    | "citizen"
    | "user";

export interface GlobalSearchResultItem {
    type: GlobalSearchResultType;
    id: string;
    title: string;
    subtitle?: string;
    href: string;
}

export const globalSearch = (q: string): Promise<{ items: GlobalSearchResultItem[] }> =>
    request<{ items: GlobalSearchResultItem[] }>("GET", API.SEARCH, { q });
