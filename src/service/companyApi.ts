import { API } from "@constants/common";
import {
    Company,
    EntityRequiredDocumentsResult,
    PaginatedData,
    RequiredDocumentRecord,
    VerificationStatus,
} from "@dts";
import { request } from "./request";
import {
    fetchEntityRequiredDocuments,
    putEntityRequiredDocuments,
    RequiredDocumentRuleInput,
    reviewEntityDocument,
} from "./requiredDocumentApi";

export interface CompanyInput {
    name: string;
    houseId: string;
    ownerName?: string;
    taxCode: string;
    representativeUserId?: string | null;
    // Lien ket tuy chon toi mot Organization co san (khong bat buoc) - xem
    // ghi chu tren models/Company.ts o backend.
    organizationId?: string | null;
    phone?: string;
    active?: boolean;
    note?: string;
}

export const fetchCompanies = (params?: {
    search?: string;
    status?: VerificationStatus;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<Company>> =>
    request<PaginatedData<Company>>("GET", API.COMPANIES, params);

export const fetchCompanyById = (id: string): Promise<Company> =>
    request<Company>("GET", `${API.COMPANIES}/${id}`);

export const createCompany = (input: CompanyInput): Promise<Company> =>
    request<Company>("POST", API.COMPANIES, input);

export const updateCompany = (
    id: string,
    input: Partial<Omit<CompanyInput, "houseId">>,
): Promise<Company> =>
    request<Company>("PATCH", `${API.COMPANIES}/${id}`, input);

export const deleteCompany = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.COMPANIES}/${id}`);

// Ghi de thu cong (admin: bat ky trang thai nao; chu ho: chi "denied" ->
// "pending" de gui lai) - status KHONG bi anh huong boi ket qua duyet giay to
// yeu cau (khac Business), xem PATCH /api/companies/:id/status o backend.
export const updateCompanyStatus = (
    id: string,
    status: VerificationStatus,
): Promise<Company> =>
    request<Company>("PATCH", `${API.COMPANIES}/${id}/status`, { status });

export const fetchCompanyRequiredDocuments = (
    id: string,
): Promise<EntityRequiredDocumentsResult> =>
    fetchEntityRequiredDocuments(API.COMPANIES, id);

export const putCompanyRequiredDocuments = (
    id: string,
    requiredDocuments: RequiredDocumentRuleInput[],
): Promise<Company> =>
    putEntityRequiredDocuments<Company>(API.COMPANIES, id, requiredDocuments);

export const reviewCompanyDocument = (
    id: string,
    documentId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string,
    approvalNote?: string,
): Promise<RequiredDocumentRecord> =>
    reviewEntityDocument(
        API.COMPANIES,
        id,
        documentId,
        decision,
        rejectionReason,
        approvalNote,
    );
