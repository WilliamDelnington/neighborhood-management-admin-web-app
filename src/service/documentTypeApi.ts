import { API } from "@constants/common";
import { DocumentType, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchDocumentTypes = (params?: {
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<DocumentType>> =>
    request<PaginatedData<DocumentType>>("GET", API.DOCUMENT_TYPES, params);

export const fetchDocumentTypeById = (id: string): Promise<DocumentType> =>
    request<DocumentType>("GET", `${API.DOCUMENT_TYPES}/${id}`);

export interface CreateDocumentTypeParams {
    name: string;
    code: string;
    description?: string;
    hasIssueDate?: boolean;
    hasExpiryDate?: boolean;
    active?: boolean;
}

export const createDocumentType = (
    params: CreateDocumentTypeParams,
): Promise<DocumentType> =>
    request<DocumentType>("POST", API.DOCUMENT_TYPES, params);

export interface UpdateDocumentTypeParams {
    name?: string;
    description?: string;
    hasIssueDate?: boolean;
    hasExpiryDate?: boolean;
    active?: boolean;
}

export const updateDocumentType = (
    id: string,
    params: UpdateDocumentTypeParams,
): Promise<DocumentType> =>
    request<DocumentType>("PATCH", `${API.DOCUMENT_TYPES}/${id}`, params);

export const deleteDocumentType = (id: string): Promise<{ _id: string }> =>
    request<{ _id: string }>("DELETE", `${API.DOCUMENT_TYPES}/${id}`);
