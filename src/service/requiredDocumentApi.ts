import { EntityRequiredDocumentsResult, RequiredDocumentRecord } from "@dts";
import { request } from "./request";

// Dung chung cho House/Household/Company (moi ban ghi tu dinh nghia dong luat
// giay to bat buoc CHO CHINH NO, khac Business - dong luat nam tren
// BusinessType dung chung, xem businessTypeApi.ts). Cac ham fetchXApi.ts chi
// truyen base path (vd API.HOUSES) vao day thay vi viet lai request() 3 lan.
export interface RequiredDocumentRuleInput {
    documentTypeId: string;
    isRequired: boolean;
    warningBeforeDays?: number;
    reviewerRoles: string[];
}

export const fetchEntityRequiredDocuments = (
    basePath: string,
    entityId: string,
): Promise<EntityRequiredDocumentsResult> =>
    request<EntityRequiredDocumentsResult>(
        "GET",
        `${basePath}/${entityId}/required-documents`,
    );

export const putEntityRequiredDocuments = <T>(
    basePath: string,
    entityId: string,
    requiredDocuments: RequiredDocumentRuleInput[],
): Promise<T> =>
    request<T>("PUT", `${basePath}/${entityId}/document-rules`, {
        requiredDocuments,
    });

export const reviewEntityDocument = (
    basePath: string,
    entityId: string,
    documentId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string,
    approvalNote?: string,
): Promise<RequiredDocumentRecord> =>
    request<RequiredDocumentRecord>(
        "PUT",
        `${basePath}/${entityId}/documents/${documentId}/review`,
        { decision, rejectionReason, approvalNote },
    );
