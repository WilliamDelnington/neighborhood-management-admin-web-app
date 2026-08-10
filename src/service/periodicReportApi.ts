import { API } from "@constants/common";
import {
    PaginatedData,
    PeriodicReport,
    PeriodicReportSections,
    PeriodicReportStatus,
    PeriodicReportType,
} from "@dts";
import { request } from "./request";

export interface FetchPeriodicReportsParams {
    page?: number;
    limit?: number;
    status?: PeriodicReportStatus;
    view?: "mine" | "received";
}

export const fetchPeriodicReports = (
    params: FetchPeriodicReportsParams = {},
): Promise<PaginatedData<PeriodicReport>> =>
    request<PaginatedData<PeriodicReport>>("GET", API.PERIODIC_REPORTS, {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        status: params.status,
        view: params.view,
    });

export const fetchPeriodicReportById = (id: string): Promise<PeriodicReport> =>
    request<PeriodicReport>("GET", `${API.PERIODIC_REPORTS}/${id}`);

export interface PeriodicReportInput {
    type: PeriodicReportType;
    periodStart: string;
    periodEnd: string;
    neighborhoodId?: string;
    sections?: PeriodicReportSections;
    submittedToUserId?: string;
}

export const createPeriodicReport = (
    input: PeriodicReportInput,
): Promise<PeriodicReport> =>
    request<PeriodicReport>("POST", API.PERIODIC_REPORTS, input);

export const updatePeriodicReport = (
    id: string,
    input: Partial<PeriodicReportInput>,
): Promise<PeriodicReport> =>
    request<PeriodicReport>(
        "PATCH",
        `${API.PERIODIC_REPORTS}/${id}`,
        input,
    );

export const submitPeriodicReport = (id: string): Promise<PeriodicReport> =>
    request<PeriodicReport>(
        "POST",
        `${API.PERIODIC_REPORTS}/${id}/submit`,
    );

export const requestPeriodicReportRevision = (
    id: string,
    note: string,
): Promise<PeriodicReport> =>
    request<PeriodicReport>(
        "POST",
        `${API.PERIODIC_REPORTS}/${id}/request-revision`,
        { note },
    );
