import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import type {
    InspectionCampaign,
    InspectionChecklistItem,
    InspectionCreationOptions,
    InspectionOutcome,
    InspectionResult,
    InspectionSummary,
    InspectionTarget,
    PaginatedData,
} from "@dts";
import { request } from "./request";

const v1 = API.INSPECTIONS_V1;

export type InspectionAnswerInput = { checklistItemId: string; value: unknown };
export type InspectionResultInput = {
    targetId: string;
    answers: InspectionAnswerInput[];
    gpsLat?: number;
    gpsLng?: number;
    note?: string;
    outcome?: InspectionOutcome;
};

export type CreateInspectionCampaignInput = {
    name: string;
    purpose: string;
    checklistTemplate: InspectionChecklistItem[];
    allowSelfDeclaration: boolean;
    requiredEvidence: boolean;
    startAt: string;
    dueAt: string;
    targetNeighborhoodIds: string[];
    targetHouseIds?: string[];
};

export const fetchInspectionCampaigns = (params?: { page?: number; status?: string }) =>
    request<PaginatedData<InspectionCampaign>>("GET", API.INSPECTION_CAMPAIGNS, {
        page: params?.page || 1,
        limit: DEFAULT_PAGE_SIZE,
        status: params?.status,
    });

export const fetchInspectionCampaign = (id: string) =>
    request<InspectionCampaign>("GET", `${v1}/inspection-campaigns/${id}`);

export const fetchInspectionCreationOptions = (neighborhoodIds: string[] = []) =>
    request<InspectionCreationOptions>(
        "GET",
        `${v1}/inspection-campaigns/creation-options`,
        { neighborhoodIds: neighborhoodIds.length ? neighborhoodIds.join(",") : undefined },
    );

export const createInspectionCampaign = (input: CreateInspectionCampaignInput) =>
    request<InspectionCampaign>("POST", `${v1}/inspection-campaigns`, input);

export const updateInspectionCampaignChecklist = (
    id: string,
    checklistTemplate: InspectionChecklistItem[],
) => request<InspectionCampaign>(
    "PATCH",
    `${v1}/inspection-campaigns/${id}`,
    { checklistTemplate },
);

export const updateInspectionCampaignDetails = (
    id: string,
    input: { name: string; purpose: string },
) => request<InspectionCampaign>(
    "PATCH",
    `${v1}/inspection-campaigns/${id}/details`,
    input,
);

export const transitionInspectionCampaign = (
    id: string,
    action: "publish" | "lock" | "reopen" | "close",
) => request<InspectionCampaign>(
    "POST",
    `${v1}/inspection-campaigns/${id}/${action}`,
);

export const fetchInspectionTargets = (
    campaignId: string,
    params?: {
        page?: number;
        limit?: number;
        resultStatus?: string;
        selfDeclarationStatus?: string;
        pending?: string;
    },
) => request<PaginatedData<InspectionTarget>>(
    "GET",
    `${v1}/inspection-campaigns/${campaignId}/targets`,
    { page: params?.page || 1, limit: params?.limit || DEFAULT_PAGE_SIZE, ...params },
);

export const fetchInspectionTarget = (id: string) =>
    request<InspectionTarget>("GET", `${v1}/inspection-targets/${id}`);

export const assignInspectionTargets = (
    campaignId: string,
    targetIds: string[],
    collaboratorUserId: string,
) => request<{ assignedCount: number }>(
    "POST",
    `${v1}/inspection-campaigns/${campaignId}/targets/assign`,
    { targetIds, collaboratorUserId },
);

export const sendInspectionForm = (targetId: string) =>
    request<{ recipientCount: number }>(
        "POST",
        `${v1}/inspection-targets/${targetId}/send-form`,
    );

export const createInspectionResult = (input: InspectionResultInput) =>
    request<InspectionResult>("POST", `${v1}/inspection-results`, input);

export const fetchInspectionResult = (id: string) =>
    request<InspectionResult>("GET", `${v1}/inspection-results/${id}`);

export const updateInspectionResult = (
    id: string,
    input: Omit<InspectionResultInput, "targetId">,
) => request<InspectionResult>("PATCH", `${v1}/inspection-results/${id}`, input);

export const uploadInspectionEvidence = (id: string, file: File) => {
    const data = new FormData();
    data.append("file", file);
    return request("POST", `${v1}/inspection-results/${id}/attachments`, data);
};

export const transitionInspectionResult = (
    id: string,
    action: "submit" | "verify" | "request-revision" | "require-field-check",
    input: { note?: string; outcome?: InspectionOutcome } = {},
) => request<InspectionResult>("POST", `${v1}/inspection-results/${id}/${action}`, input);

export const remindInspection = (campaignId: string, targetIds?: string[]) =>
    request<{ targetCount: number; recipientCount: number }>(
        "POST",
        `${v1}/inspection-campaigns/${campaignId}/remind`,
        { targetIds: targetIds?.length ? targetIds : undefined },
    );

export const fetchInspectionSummary = (campaignId: string) =>
    request<InspectionSummary>("GET", `${v1}/inspection-campaigns/${campaignId}/summary`);

export const submitInspectionToWard = (campaignId: string, neighborhoodId?: string) =>
    request("POST", `${v1}/inspection-campaigns/${campaignId}/submit-to-ward`, {
        neighborhoodId,
    });
