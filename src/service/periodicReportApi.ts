import { API, BASE_URL, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    PaginatedData,
    PeriodicReport,
    PeriodicReportSections,
    PeriodicReportStatus,
    PeriodicReportType,
    FileAsset,
} from "@dts";
import { useAuthStore } from "@store/authStore";
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
        limit: params.limit ?? DEFAULT_PAGE_SIZE,
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

export type PeriodicReportContext = {
    neighborhoods: Array<{
        _id: string;
        code: string;
        name: string;
        wardCode?: number;
        wardName?: string;
    }>;
    recipients: Array<{
        id: string;
        displayName: string;
        roles: string[];
        wardCode?: number;
        wardName?: string;
    }>;
};

export const fetchPeriodicReportContext = (
    neighborhoodId?: string,
): Promise<PeriodicReportContext> =>
    request<PeriodicReportContext>("GET", `${API.PERIODIC_REPORTS}/context`, {
        neighborhoodId,
    });

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

export const receivePeriodicReport = (id: string): Promise<PeriodicReport> =>
    request<PeriodicReport>("POST", `${API.PERIODIC_REPORTS}/${id}/receive`);

export const acceptPeriodicReport = (id: string): Promise<PeriodicReport> =>
    request<PeriodicReport>("POST", `${API.PERIODIC_REPORTS}/${id}/accept`);

export const recallPeriodicReport = (id: string): Promise<PeriodicReport> =>
    request<PeriodicReport>("POST", `${API.PERIODIC_REPORTS}/${id}/recall`);

export const refreshPeriodicReportSummary = (id: string): Promise<PeriodicReport> =>
    request<PeriodicReport>("POST", `${API.PERIODIC_REPORTS}/${id}/refresh-summary`);

export const fetchPeriodicReportAttachments = (id: string): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.PERIODIC_REPORTS}/${id}/attachments`);

export const uploadPeriodicReportAttachment = (
    id: string,
    file: File,
): Promise<FileAsset> => {
    const data = new FormData();
    data.append("file", file);
    return request<FileAsset>("POST", `${API.PERIODIC_REPORTS}/${id}/attachments`, data);
};

export const deletePeriodicReportAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>(
        "DELETE",
        `${API.PERIODIC_REPORTS}/${id}/attachments/${fileId}`,
    );

export const downloadPeriodicReportPdf = async (
    id: string,
    version?: number,
): Promise<void> => {
    const { token } = useAuthStore.getState();
    const url = new URL(`${API.PERIODIC_REPORTS}/${id}/export`, BASE_URL);
    if (version) url.searchParams.set("version", String(version));
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error("Không thể xuất báo cáo PDF");
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `bao-cao-to-dan-pho-v${version || "moi-nhat"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
};
