import { API, BASE_URL } from "@constants/common";
import { useAuthStore } from "@store/authStore";
import { request } from "./request";

export const fetchPopulationReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/population`, { fromDate, toDate });

export const fetchComplaintReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/complaints`, { fromDate, toDate });

export const fetchPcccReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/pccc`, { fromDate, toDate });

export const fetchSecurityReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/security`, { fromDate, toDate });

export const fetchFinanceReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/finance`, { fromDate, toDate });

export const fetchMeetingReport = (meetingId: string): Promise<unknown> =>
    request("GET", `${API.REPORTS}/meetings`, { meetingId });

export const fetchSurveyReport = (surveyId: string): Promise<unknown> =>
    request("GET", `${API.REPORTS}/surveys`, { surveyId });

export const fetchHouseReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/houses`, { fromDate, toDate });

export const fetchBusinessReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/business`, { fromDate, toDate });

export const fetchHouseholdReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/households`, { fromDate, toDate });

export const fetchRequestReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/requests`, { fromDate, toDate });

/**
 * Cac bao cao ho tro tai xuong Excel qua query ?format=excel. Vi day la tai file nhi phan
 * (khong theo envelope JSON chuan), khong dung request() ma mo truc tiep bang token trong URL
 * qua fetch + tao link tai xuong tam thoi.
 */
export const downloadReportExcel = async (
    reportPath:
        | "population"
        | "complaints"
        | "pccc"
        | "security"
        | "finance"
        | "meetings"
        | "surveys"
        | "houses"
        | "business"
        | "households"
        | "requests",
    fileName: string,
    extraParams: Record<string, string | undefined> = {},
): Promise<void> => {
    const { token } = useAuthStore.getState();
    const url = new URL(`${API.REPORTS}/${reportPath}`, BASE_URL);
    url.searchParams.set("format", "excel");
    Object.entries(extraParams).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
        throw new Error("Không thể xuất báo cáo Excel");
    }
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
};

export const downloadReportPdf = async (
    reportPath:
        | "population"
        | "complaints"
        | "pccc"
        | "security"
        | "finance"
        | "houses"
        | "business"
        | "households"
        | "requests",
    fileName: string,
    extraParams: Record<string, string | undefined> = {},
): Promise<void> => {
    const { token } = useAuthStore.getState();
    const url = new URL(`${API.REPORTS}/pdf`, BASE_URL);
    url.searchParams.set("report", reportPath);
    Object.entries(extraParams).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error("Không thể xuất báo cáo PDF");
    const objectUrl = window.URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
};
