import { API } from "@constants/common";
import { DocumentType, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchDocumentTypes = (params?: {
    search?: string;
    active?: boolean;
    hasIssueDate?: boolean;
    hasExpiryDate?: boolean;
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
    // Tep mau (khong bat buoc) minh hoa giay to nay - xem
    // documentTypeService.ts o backend.
    sampleFile?: File;
}

export const createDocumentType = (
    params: CreateDocumentTypeParams,
): Promise<DocumentType> => {
    const { sampleFile, ...rest } = params;
    if (!sampleFile) {
        return request<DocumentType>("POST", API.DOCUMENT_TYPES, rest);
    }
    const formData = new FormData();
    formData.append("name", rest.name);
    formData.append("code", rest.code);
    if (rest.description) formData.append("description", rest.description);
    formData.append("hasIssueDate", String(!!rest.hasIssueDate));
    formData.append("hasExpiryDate", String(!!rest.hasExpiryDate));
    formData.append("active", String(rest.active ?? true));
    formData.append("sampleFile", sampleFile);
    return request<DocumentType>("POST", API.DOCUMENT_TYPES, formData);
};

export interface UpdateDocumentTypeParams {
    name?: string;
    description?: string;
    hasIssueDate?: boolean;
    hasExpiryDate?: boolean;
    active?: boolean;
    sampleFile?: File;
    // true = xoa tep mau hien co ma khong thay bang tep moi.
    removeSampleFile?: boolean;
}

export const updateDocumentType = (
    id: string,
    params: UpdateDocumentTypeParams,
): Promise<DocumentType> => {
    const { sampleFile, removeSampleFile, ...rest } = params;
    if (!sampleFile && !removeSampleFile) {
        return request<DocumentType>(
            "PATCH",
            `${API.DOCUMENT_TYPES}/${id}`,
            rest,
        );
    }
    const formData = new FormData();
    if (rest.name !== undefined) formData.append("name", rest.name);
    if (rest.description !== undefined) {
        formData.append("description", rest.description);
    }
    if (rest.hasIssueDate !== undefined) {
        formData.append("hasIssueDate", String(rest.hasIssueDate));
    }
    if (rest.hasExpiryDate !== undefined) {
        formData.append("hasExpiryDate", String(rest.hasExpiryDate));
    }
    if (rest.active !== undefined) formData.append("active", String(rest.active));
    if (sampleFile) formData.append("sampleFile", sampleFile);
    if (removeSampleFile) formData.append("removeSampleFile", "true");
    return request<DocumentType>(
        "PATCH",
        `${API.DOCUMENT_TYPES}/${id}`,
        formData,
    );
};

export const deleteDocumentType = (id: string): Promise<{ _id: string }> =>
    request<{ _id: string }>("DELETE", `${API.DOCUMENT_TYPES}/${id}`);
