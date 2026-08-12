import { API } from "@constants/common";
import {
    InfrastructureAsset,
    InfrastructureAssetCondition,
    InfrastructureAssetType,
    PaginatedData,
} from "@dts";
import { request } from "./request";

export interface FetchInfrastructureAssetsParams {
    page?: number;
    limit?: number;
    search?: string;
    neighborhoodId?: string;
    type?: InfrastructureAssetType;
    condition?: InfrastructureAssetCondition;
}

export const fetchInfrastructureAssets = (
    params: FetchInfrastructureAssetsParams = {},
): Promise<PaginatedData<InfrastructureAsset>> =>
    request<PaginatedData<InfrastructureAsset>>(
        "GET",
        API.INFRASTRUCTURE_ASSETS,
        {
            page: params.page ?? 1,
            limit: params.limit ?? 30,
            search: params.search,
            neighborhoodId: params.neighborhoodId,
            type: params.type,
            condition: params.condition,
        },
    );

export const fetchInfrastructureAssetById = (
    id: string,
): Promise<InfrastructureAsset> =>
    request<InfrastructureAsset>(
        "GET",
        `${API.INFRASTRUCTURE_ASSETS}/${id}`,
    );

export interface InfrastructureAssetInput {
    name: string;
    type: InfrastructureAssetType;
    neighborhoodId: string;
    location?: string;
    condition?: InfrastructureAssetCondition;
    note?: string;
}

export const createInfrastructureAsset = (
    input: InfrastructureAssetInput,
): Promise<InfrastructureAsset> =>
    request<InfrastructureAsset>(
        "POST",
        API.INFRASTRUCTURE_ASSETS,
        input,
    );

export const updateInfrastructureAsset = (
    id: string,
    input: Partial<Omit<InfrastructureAssetInput, "neighborhoodId">>,
): Promise<InfrastructureAsset> =>
    request<InfrastructureAsset>(
        "PATCH",
        `${API.INFRASTRUCTURE_ASSETS}/${id}`,
        input,
    );

export const deleteInfrastructureAsset = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.INFRASTRUCTURE_ASSETS}/${id}`);
