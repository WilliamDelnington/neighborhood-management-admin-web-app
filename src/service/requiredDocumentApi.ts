import {
    EntityRequiredDocumentsResult,
    RequiredDocumentRecord,
    RequiredDocumentRule,
} from "@dts";
import { request } from "./request";

// Dung chung cho House/Household/Company. Dong luat "giay to bat buoc/tuy
// chon" AP DUNG CHUNG cho CA MOT LOAI ban ghi (tat ca House, hoac tat ca
// Household, hoac tat ca Company) - KHONG khai bao rieng tren tung ban ghi
// (khac thiet ke ban dau: luu rieng tren tung ban ghi ton nhieu thoi gian/
// dung luong DB khong can thiet khi cac ban ghi cung loai thuong yeu cau
// giong nhau). Khac Business (dong luat nam tren BusinessType, xem
// businessTypeApi.ts) - House/Household/Company khong co "Type" rieng nen
// dung chung mot cau hinh duy nhat cho ca loai. Cac ham fetchXApi.ts chi
// truyen base path (vd API.HOUSES) vao day thay vi viet lai request() 3 lan.
export interface RequiredDocumentRuleInput {
    documentTypeId: string;
    isRequired: boolean;
    warningBeforeDays?: number;
    reviewerRoles: string[];
}

export const fetchRequiredDocumentRules = (
    basePath: string,
): Promise<{ requiredDocuments: RequiredDocumentRule[] }> =>
    request<{ requiredDocuments: RequiredDocumentRule[] }>(
        "GET",
        `${basePath}/document-rules`,
    );

export const putRequiredDocumentRules = (
    basePath: string,
    requiredDocuments: RequiredDocumentRuleInput[],
): Promise<{ requiredDocuments: RequiredDocumentRule[] }> =>
    request<{ requiredDocuments: RequiredDocumentRule[] }>(
        "PUT",
        `${basePath}/document-rules`,
        { requiredDocuments },
    );

export const fetchEntityRequiredDocuments = (
    basePath: string,
    entityId: string,
): Promise<EntityRequiredDocumentsResult> =>
    request<EntityRequiredDocumentsResult>(
        "GET",
        `${basePath}/${entityId}/required-documents`,
    );

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
