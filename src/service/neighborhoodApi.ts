import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    FileAsset,
    Neighborhood,
    NeighborhoodHistory,
    NeighborhoodCollaboratorAssignment,
    NeighborhoodCollaboratorScope,
    NeighborhoodLeaderAssignment,
    NeighborhoodColeaderAssignment,
    NeighborhoodStatus,
    NeighborhoodTerm,
    PaginatedData,
} from "@dts";
import { request } from "./request";

export interface FetchNeighborhoodsParams {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    status?: NeighborhoodStatus;
    streetId?: string;
    leaderUserId?: string;
    filterLeaderUserId?: string;
}

export const fetchNeighborhoods = (
    params: FetchNeighborhoodsParams = {},
): Promise<PaginatedData<Neighborhood>> =>
    request<PaginatedData<Neighborhood>>("GET", API.NEIGHBORHOODS, {
        page: params.page ?? 1,
        limit: params.limit ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        active: params.active,
        status: params.status,
        streetId: params.streetId,
        leaderUserId: params.leaderUserId,
        filterLeaderUserId: params.filterLeaderUserId,
    });

export const fetchNeighborhoodById = (id: string): Promise<Neighborhood> =>
    request<Neighborhood>("GET", `${API.NEIGHBORHOODS}/${id}`);

export interface NeighborhoodInput {
    name: string;
    code: string;
    sequence: number;
    active?: boolean;
    status?: NeighborhoodStatus;
    effectiveFrom?: string;
    effectiveTo?: string;
    provinceCode?: number;
    provinceName?: string;
    wardCode?: number;
    wardName?: string;
    address?: string;
    description?: string;
    contactPhone?: string;
    notes?: string;
    streetIds?: string[];
    alleyDescriptions?: string[];
    boundaryType?: "NONE" | "DOCUMENT" | "GEOJSON";
}

export const createNeighborhood = (
    input: NeighborhoodInput,
): Promise<Neighborhood> =>
    request<Neighborhood>("POST", API.NEIGHBORHOODS, input);

// code/sequence la bat bien sau khi tao - khong nam trong kieu cap nhat.
export type UpdateNeighborhoodInput = Partial<
    Omit<NeighborhoodInput, "code" | "sequence">
>;

export const updateNeighborhood = (
    id: string,
    input: UpdateNeighborhoodInput,
): Promise<Neighborhood> =>
    request<Neighborhood>("PATCH", `${API.NEIGHBORHOODS}/${id}`, input);

export const assignNeighborhoodLeader = (
    neighborhoodId: string,
    leaderUserId: string | null,
    note?: string,
    options?: { termId?: string; endAt?: string },
): Promise<Neighborhood> =>
    request<Neighborhood>(
        "PUT",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/leader`,
        { leaderUserId, note, ...options },
    );

export const fetchNeighborhoodLeaderHistory = (
    id: string,
): Promise<NeighborhoodLeaderAssignment[]> =>
    request<NeighborhoodLeaderAssignment[]>(
        "GET",
        `${API.NEIGHBORHOODS}/${id}/leader-history`,
    );

export const fetchNeighborhoodColeaders = (
    id: string,
): Promise<NeighborhoodColeaderAssignment[]> =>
    request<NeighborhoodColeaderAssignment[]>(
        "GET",
        `${API.NEIGHBORHOODS}/${id}/coleaders`,
    );

export const assignNeighborhoodColeader = (
    neighborhoodId: string,
    coleaderUserId: string,
    note?: string,
    options?: { termId?: string; endAt?: string },
): Promise<void> =>
    request<void>(
        "POST",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/coleaders`,
        { coleaderUserId, note, ...options },
    );

export const unassignNeighborhoodColeader = (
    neighborhoodId: string,
    coleaderUserId: string,
): Promise<void> =>
    request<void>(
        "DELETE",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/coleaders`,
        { coleaderUserId },
    );

export const fetchNeighborhoodColeaderHistory = (
    id: string,
): Promise<NeighborhoodColeaderAssignment[]> =>
    request<NeighborhoodColeaderAssignment[]>(
        "GET",
        `${API.NEIGHBORHOODS}/${id}/coleader-history`,
    );

export interface NeighborhoodTermInput {
    name: string;
    startAt: string;
    endAt: string;
    notes?: string;
    // true = nut "Lưu nháp" (luon DRAFT); false/khong gui = nut "Tạo" (tu
    // tinh NOT_STARTED/IN_PROGRESS/ENDED theo ngay o backend) - xem
    // resolveTermStatusByDate trong neighborhoodService.ts.
    saveAsDraft?: boolean;
}

export interface UpdateNeighborhoodTermInput {
    name?: string;
    startAt?: string;
    endAt?: string;
    notes?: string;
    // Chi co tac dung khi nhiem ky dang DRAFT - true = luu thong tin VA
    // chuyen sang NOT_STARTED/IN_PROGRESS (nut "Tạo" khi sua ban nhap);
    // false/khong gui = chi luu thong tin, van la DRAFT (nut "Lưu nháp").
    finalize?: boolean;
}

export const fetchNeighborhoodTerms = (id: string): Promise<NeighborhoodTerm[]> =>
    request<NeighborhoodTerm[]>("GET", `${API.NEIGHBORHOODS}/${id}/terms`);

export const createNeighborhoodTerm = (
    id: string,
    input: NeighborhoodTermInput,
): Promise<NeighborhoodTerm> =>
    request<NeighborhoodTerm>("POST", `${API.NEIGHBORHOODS}/${id}/terms`, input);

export const updateNeighborhoodTerm = (
    neighborhoodId: string,
    termId: string,
    input: UpdateNeighborhoodTermInput,
): Promise<NeighborhoodTerm> =>
    request<NeighborhoodTerm>(
        "PATCH",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/terms/${termId}`,
        input,
    );

// Chi xoa duoc nhiem ky DRAFT (backend chan 409 cho cac trang thai khac).
export const deleteNeighborhoodTerm = (
    neighborhoodId: string,
    termId: string,
): Promise<null> =>
    request<null>(
        "DELETE",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/terms/${termId}`,
    );

// Huy mot nhiem ky CHUA bat dau (NOT_STARTED -> CANCELLED) - khong can ly do.
export const cancelNeighborhoodTerm = (
    neighborhoodId: string,
    termId: string,
): Promise<NeighborhoodTerm> =>
    request<NeighborhoodTerm>(
        "POST",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/terms/${termId}/cancel`,
    );

// Ket thuc SOM mot nhiem ky dang dien ra (IN_PROGRESS -> ENDED) - ly do BAT
// BUOC (khac ket thuc dung han, tu dong khong can hanh dong).
export const endNeighborhoodTermEarly = (
    neighborhoodId: string,
    termId: string,
    reason: string,
): Promise<NeighborhoodTerm> =>
    request<NeighborhoodTerm>(
        "POST",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/terms/${termId}/end-early`,
        { reason },
    );

export const fetchNeighborhoodHistory = (
    id: string,
): Promise<NeighborhoodHistory[]> =>
    request<NeighborhoodHistory[]>("GET", `${API.NEIGHBORHOODS}/${id}/history`);

export const fetchNeighborhoodAttachments = (id: string): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.NEIGHBORHOODS}/${id}/attachments`);

export const createNeighborhoodAttachment = (
    id: string,
    input: { name: string; url: string; description?: string },
): Promise<FileAsset> =>
    request<FileAsset>("POST", `${API.NEIGHBORHOODS}/${id}/attachments`, input);

export const deleteNeighborhoodAttachment = (
    id: string,
    fileId: string,
): Promise<null> =>
    request<null>(
        "DELETE",
        `${API.NEIGHBORHOODS}/${id}/attachments/${fileId}`,
    );

export interface AssignNeighborhoodCollaboratorInput {
    collaboratorUserId: string;
    scopeType: NeighborhoodCollaboratorScope;
    streetId?: string;
    houseIds?: string[];
    campaignId?: string;
    startAt?: string;
    endAt?: string;
    note?: string;
}

export const fetchNeighborhoodCollaborators = (
    id: string,
): Promise<NeighborhoodCollaboratorAssignment[]> =>
    request<NeighborhoodCollaboratorAssignment[]>(
        "GET",
        `${API.NEIGHBORHOODS}/${id}/collaborators`,
    );

export const assignNeighborhoodCollaborator = (
    id: string,
    input: AssignNeighborhoodCollaboratorInput,
): Promise<NeighborhoodCollaboratorAssignment> =>
    request<NeighborhoodCollaboratorAssignment>(
        "POST",
        `${API.NEIGHBORHOODS}/${id}/collaborators`,
        input,
    );

export const unassignNeighborhoodCollaborator = (
    id: string,
    assignmentId: string,
): Promise<null> =>
    request<null>(
        "DELETE",
        `${API.NEIGHBORHOODS}/${id}/collaborators`,
        { assignmentId },
    );
