import { API } from "@constants/common";
import { DashboardSummary } from "@dts";
import { request } from "./request";

export const fetchDashboardSummary = (): Promise<DashboardSummary> =>
    request<DashboardSummary>("GET", `${API.REPORTS}/dashboard`);
