import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
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
    eligibleAll?: boolean;
    eligibleRoles?: string[];
    eligibleStreetIds?: string[];
    eligibleNeighborhoodIds?: string[];
    eligibleBusinessTypeIds?: string[];
    resultSummary?: string;
    // Nguoi duoc chu khao sat (nguoi tao) uy quyen cung chinh sua/mo/dong/xoa -
    // moi id phai la tai khoan dang co quyen "surveys.update".
    coEditorUserIds?: string[];
}

export interface SurveyAnswerInput {
    questionId: string;
    selectedOptions: string[];
    otherText?: string;
}

export const fetchSurveys = (
    openOnly = false,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
): Promise<PaginatedData<Survey>> =>
    request<PaginatedData<Survey>>(
        "GET",
        API.SURVEYS,
        { openOnly: openOnly ? 1 : undefined, page, limit },
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

export const respondToSurvey = (
    id: string,
    answers: SurveyAnswerInput[],
): Promise<null> =>
    request<null>("POST", `${API.SURVEYS}/${id}/respond`, { answers });

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
