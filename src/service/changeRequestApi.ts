import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { ChangeRequest, ChangeRequestTargetModel, ChangeRequestType, PaginatedData } from "@dts";
import { request } from "./request";

export interface CreateChangeRequestInput {
    targetModel: ChangeRequestTargetModel;
    targetId: string;
    changeType: ChangeRequestType;
    patch?: Record<string, unknown>;
    reason?: string;
}

export const createChangeRequest = (
    input: CreateChangeRequestInput,
): Promise<ChangeRequest> =>
    request<ChangeRequest>("POST", API.CHANGE_REQUESTS, input);

export const fetchChangeRequests = (
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    status: ChangeRequest["status"] | undefined = undefined,
    view: "mine" | "staff" | undefined = undefined,
): Promise<PaginatedData<ChangeRequest>> =>
    request<PaginatedData<ChangeRequest>>("GET", API.CHANGE_REQUESTS, {
        page,
        limit,
        status,
        view,
    });

export const fetchChangeRequestDetail = (id: string): Promise<ChangeRequest> =>
    request<ChangeRequest>("GET", `${API.CHANGE_REQUESTS}/${id}`);

export const decideChangeRequest = (
    id: string,
    approve: boolean,
    decisionNote?: string,
): Promise<ChangeRequest> =>
    request<ChangeRequest>("POST", `${API.CHANGE_REQUESTS}/${id}/decide`, {
        approve,
        decisionNote,
    });
