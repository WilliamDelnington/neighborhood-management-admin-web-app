import { API } from "@constants/common";
import { FileAsset, FileAssetCategory, PaginatedData } from "@dts";
import { request } from "./request";

export const fetchFileAssets = (params?: {
    category?: FileAssetCategory;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<FileAsset>> =>
    request<PaginatedData<FileAsset>>("GET", API.FILES, {
        ...params,
        admin: 1,
    });

export const fetchFileAssetById = (id: string): Promise<FileAsset> =>
    request<FileAsset>("GET", `${API.FILES}/${id}`);

export interface CreateFileAssetParams {
    name: string;
    url: string;
    description?: string;
    category: FileAssetCategory;
    isPublic: boolean;
    targetRoles: string[];
    audienceAll: boolean;
}

export const createFileAsset = (
    params: CreateFileAssetParams,
): Promise<FileAsset> => request<FileAsset>("POST", API.FILES, params);

export interface UpdateFileAssetParams {
    name?: string;
    url?: string;
    description?: string;
    category?: FileAssetCategory;
    isPublic?: boolean;
    targetRoles?: string[];
    audienceAll?: boolean;
}

export const updateFileAsset = (
    id: string,
    params: UpdateFileAssetParams,
): Promise<FileAsset> =>
    request<FileAsset>("PATCH", `${API.FILES}/${id}`, params);

export const deleteFileAsset = (id: string): Promise<null> =>
    request<null>("DELETE", `${API.FILES}/${id}`);
