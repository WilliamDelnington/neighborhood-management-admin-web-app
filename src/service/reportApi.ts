import { API, BASE_URL } from "@constants/common";
import { useAuthStore } from "@store/authStore";
import { request } from "./request";

export const fetchPopulationReport = (): Promise<unknown> =>
    request("GET", `${API.REPORTS}/population`);

export const fetchComplaintReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/complaints`, { fromDate, toDate });

export const fetchPcccReport = (): Promise<unknown> =>
    request("GET", `${API.REPORTS}/pccc`);

export const fetchSecurityReport = (): Promise<unknown> =>
    request("GET", `${API.REPORTS}/security`);

export const fetchFinanceReport = (
    fromDate?: string,
    toDate?: string,
): Promise<unknown> =>
    request("GET", `${API.REPORTS}/finance`, { fromDate, toDate });

export const fetchMeetingReport = (meetingId: string): Promise<unknown> =>
    request("GET", `${API.REPORTS}/meetings`, { meetingId });

export const fetchSurveyReport = (surveyId: string): Promise<unknown> =>
    request("GET", `${API.REPORTS}/surveys`, { surveyId });

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
        | "surveys",
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
