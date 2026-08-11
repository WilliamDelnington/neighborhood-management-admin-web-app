import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    AuditLogRecord,
    MyRequestItem,
    PaginatedData,
    RequestAttachment,
    RequestComment,
    RequestHouseRole,
    RequestItem,
    RequestMeta,
    RequestPriority,
    RequestStatus,
    RequestType,
} from "@dts";
import { request } from "./request";

export interface CreateRequestInput {
    type: RequestType;
    title: string;
    description?: string;
    priority?: RequestPriority;
    relatedModel?: string;
    relatedId?: string;
    houseId?: string;
    dueDate?: string;
    targetUserIds?: string[];
    targetRoles?: string[];
    houseRole?: RequestHouseRole;
    targetHouseNeighborhoodLeader?: boolean;
    formData?: Record<string, unknown>;
}

export const fetchRequestMeta = (): Promise<RequestMeta> =>
    request<RequestMeta>("GET", API.REQUESTS_META);

export const fetchRequests = (params?: {
    page?: number;
    limit?: number;
    type?: RequestType;
    relatedModel?: string;
    relatedId?: string;
    houseId?: string;
}): Promise<PaginatedData<RequestItem>> =>
    request<PaginatedData<RequestItem>>("GET", API.REQUESTS, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        type: params?.type,
        relatedModel: params?.relatedModel,
        relatedId: params?.relatedId,
        houseId: params?.houseId,
    });

export const fetchRequestById = (id: string): Promise<RequestItem> =>
    request<RequestItem>("GET", `${API.REQUESTS}/${id}`);

export const createRequest = (
    input: CreateRequestInput,
): Promise<RequestItem> => request<RequestItem>("POST", API.REQUESTS, input);

export const updateRequest = (
    id: string,
    input: {
        title?: string;
        description?: string;
        note?: string;
        priority?: RequestPriority;
        dueDate?: string;
        addTargetUserIds?: string[];
        addTargetRoles?: string[];
    },
): Promise<RequestItem> =>
    request<RequestItem>("PATCH", `${API.REQUESTS}/${id}`, input);

export const cancelRequest = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.REQUESTS}/${id}`);

export const fetchMyRequests = (params?: {
    page?: number;
    limit?: number;
    status?: RequestStatus;
    type?: RequestType;
    overdueOnly?: boolean;
}): Promise<PaginatedData<MyRequestItem>> =>
    request<PaginatedData<MyRequestItem>>("GET", API.REQUESTS_MY, {
        page: params?.page || 1,
        limit: params?.limit || DEFAULT_PAGE_SIZE,
        status: params?.status,
        type: params?.type,
        overdueOnly: params?.overdueOnly,
    });

export const updateMyRequestStatus = (
    requestId: string,
    input: { status: RequestStatus; note?: string },
): Promise<MyRequestItem> =>
    request<MyRequestItem>(
        "PATCH",
        `${API.REQUESTS}/${requestId}/recipients/me`,
        input,
    );

export const updateRequestFormData = (
    requestId: string,
    formData: Record<string, unknown>,
): Promise<RequestItem> =>
    request<RequestItem>("PATCH", `${API.REQUESTS}/${requestId}/form-data`, {
        formData,
    });

export const confirmRequestRecipient = (
    requestId: string,
    userId: string,
    input: { decision: "resolved" | "in_progress"; note?: string },
) =>
    request(
        "PATCH",
        `${API.REQUESTS}/${requestId}/recipients/${userId}`,
        input,
    );

export const fetchRequestAuditLogs = (
    id: string,
    params?: { page?: number; limit?: number },
): Promise<PaginatedData<AuditLogRecord>> =>
    request<PaginatedData<AuditLogRecord>>(
        "GET",
        `${API.REQUESTS}/${id}/audit-logs`,
        params,
    );

export const fetchRequestAttachments = (
    id: string,
): Promise<RequestAttachment[]> =>
    request<RequestAttachment[]>("GET", `${API.REQUESTS}/${id}/attachments`);

export const uploadRequestAttachment = (
    id: string,
    file: File,
): Promise<RequestAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<RequestAttachment>(
        "POST",
        `${API.REQUESTS}/${id}/attachments`,
        formData,
    );
};

export const deleteRequestAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>("DELETE", `${API.REQUESTS}/${id}/attachments/${fileId}`);

export const fetchRequestComments = (
    id: string,
): Promise<RequestComment[]> =>
    request<RequestComment[]>("GET", `${API.REQUESTS}/${id}/comments`);

export const createRequestComment = (
    id: string,
    content: string,
): Promise<RequestComment> =>
    request<RequestComment>(
        "POST",
        `${API.REQUESTS}/${id}/comments`,
        { content },
    );
