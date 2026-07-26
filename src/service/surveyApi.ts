import { API } from "@constants/common";
import {
    AuditLogRecord,
    PaginatedData,
    Survey,
    SurveyQuestion,
    SurveyResults,
} from "@dts";
import { request } from "./request";

export interface SurveyInput {
    title: string;
    description?: string;
    questions: SurveyQuestion[];
}

export const fetchSurveys = (
    openOnly = false,
): Promise<PaginatedData<Survey>> =>
    request<PaginatedData<Survey>>(
        "GET",
        API.SURVEYS,
        { openOnly: openOnly ? 1 : undefined },
        { useAuth: false },
    );

export const fetchSurveyDetail = (id: string): Promise<Survey> =>
    request<Survey>("GET", `${API.SURVEYS}/${id}`, undefined, {
        useAuth: false,
    });

export const createSurvey = (input: SurveyInput): Promise<Survey> =>
    request<Survey>("POST", API.SURVEYS, input);

export const updateSurvey = (
    id: string,
    input: Partial<SurveyInput>,
): Promise<Survey> => request<Survey>("PATCH", `${API.SURVEYS}/${id}`, input);

export const openSurvey = (id: string): Promise<Survey> =>
    request<Survey>("POST", `${API.SURVEYS}/${id}/open`);

export const closeSurvey = (id: string): Promise<Survey> =>
    request<Survey>("POST", `${API.SURVEYS}/${id}/close`);

export const fetchSurveyResults = (id: string): Promise<SurveyResults> =>
    request<SurveyResults>("GET", `${API.SURVEYS}/${id}/results`);

export const fetchSurveyAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.SURVEYS}/${id}/audit-logs`,
        params,
    );
