import { API } from "@constants/common";
import { Neighborhood, NeighborhoodLeaderAssignment, PaginatedData } from "@dts";
import { request } from "./request";

export interface FetchNeighborhoodsParams {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    leaderUserId?: string;
}

export const fetchNeighborhoods = (
    params: FetchNeighborhoodsParams = {},
): Promise<PaginatedData<Neighborhood>> =>
    request<PaginatedData<Neighborhood>>("GET", API.NEIGHBORHOODS, {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
        active: params.active,
        leaderUserId: params.leaderUserId,
    });

export const fetchNeighborhoodById = (id: string): Promise<Neighborhood> =>
    request<Neighborhood>("GET", `${API.NEIGHBORHOODS}/${id}`);

export interface NeighborhoodInput {
    name: string;
    code: string;
    sequence: number;
    active?: boolean;
    address?: string;
    description?: string;
    contactPhone?: string;
    notes?: string;
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
): Promise<Neighborhood> =>
    request<Neighborhood>(
        "PUT",
        `${API.NEIGHBORHOODS}/${neighborhoodId}/leader`,
        { leaderUserId, note },
    );

export const fetchNeighborhoodLeaderHistory = (
    id: string,
): Promise<NeighborhoodLeaderAssignment[]> =>
    request<NeighborhoodLeaderAssignment[]>(
        "GET",
        `${API.NEIGHBORHOODS}/${id}/leader-history`,
    );
