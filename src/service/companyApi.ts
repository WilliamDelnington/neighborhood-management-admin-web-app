import { API } from "@constants/common";
import { Company, PaginatedData, VerificationStatus } from "@dts";
import { request } from "./request";

export interface CompanyInput {
    name: string;
    houseId: string;
    ownerName?: string;
    representativeUserId?: string | null;
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
// "pending" de gui lai) - khong co quy trinh nop/duyet giay to rieng nhu
// Business, xem PATCH /api/companies/:id/status o backend.
export const updateCompanyStatus = (
    id: string,
    status: VerificationStatus,
): Promise<Company> =>
    request<Company>("PATCH", `${API.COMPANIES}/${id}/status`, { status });
