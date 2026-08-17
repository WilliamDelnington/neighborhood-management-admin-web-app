import { API } from "@constants/common";
import {
    EntityRequiredDocumentsResult,
    Household,
    PaginatedData,
    RequiredDocumentRecord,
    RequiredDocumentRule,
    VerificationStatus,
} from "@dts";
import { request } from "./request";
import {
    fetchEntityRequiredDocuments,
    fetchRequiredDocumentRules,
    putRequiredDocumentRules,
    RequiredDocumentRuleInput,
    reviewEntityDocument,
} from "./requiredDocumentApi";

export interface HouseholdInput {
    cluster: string;
    address: string;
    headOfHousehold: string;
    // Lien ket toi tai khoan house_owner thuc su - null = khong lien ket.
    headOfHouseholdUserId?: string | null;
    phone?: string;
    memberCount?: number;
    ownershipType?: "chinh_chu" | "cho_thue";
    needsSupport?: boolean;
    // id House, hoac null de go lien ket (chua gan nha so).
    houseId?: string | null;
    note?: string;
}

export const fetchHouseholds = (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cluster?: string;
    houseId?: string;
    unassigned?: boolean;
}): Promise<PaginatedData<Household>> =>
    request<PaginatedData<Household>>("GET", API.HOUSEHOLDS, params);

export const fetchHouseholdById = (id: string): Promise<Household> =>
    request<Household>("GET", `${API.HOUSEHOLDS}/${id}`);

export const fetchHouseholdCitizens = (id: string) =>
    request("GET", `${API.HOUSEHOLDS}/${id}/citizens`);

export const createHousehold = (input: HouseholdInput): Promise<Household> =>
    request<Household>("POST", API.HOUSEHOLDS, input);

export const updateHousehold = (
    id: string,
    input: Partial<HouseholdInput>,
): Promise<Household> =>
    request<Household>("PATCH", `${API.HOUSEHOLDS}/${id}`, input);

export const deleteHousehold = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.HOUSEHOLDS}/${id}`);

export const updateHouseholdStatus = (
    id: string,
    status: VerificationStatus,
    note?: string,
): Promise<Household> =>
    request<Household>("PATCH", `${API.HOUSEHOLDS}/${id}/status`, { status, note });

export const fetchHouseholdRequiredDocuments = (
    id: string,
): Promise<EntityRequiredDocumentsResult> =>
    fetchEntityRequiredDocuments(API.HOUSEHOLDS, id);

/** Dong luat giay to bat buoc AP DUNG CHUNG cho toan bo ho dan (khong phai mot ho cu the). */
export const fetchHouseholdRequiredDocumentRules = (): Promise<{
    requiredDocuments: RequiredDocumentRule[];
}> => fetchRequiredDocumentRules(API.HOUSEHOLDS);

export const putHouseholdRequiredDocumentRules = (
    requiredDocuments: RequiredDocumentRuleInput[],
): Promise<{ requiredDocuments: RequiredDocumentRule[] }> =>
    putRequiredDocumentRules(API.HOUSEHOLDS, requiredDocuments);

export const reviewHouseholdDocument = (
    id: string,
    documentId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string,
    approvalNote?: string,
): Promise<RequiredDocumentRecord> =>
    reviewEntityDocument(
        API.HOUSEHOLDS,
        id,
        documentId,
        decision,
        rejectionReason,
        approvalNote,
    );
