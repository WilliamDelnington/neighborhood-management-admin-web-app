import { API } from "@constants/common";
import {
    ModulePermissionGroup,
    NhomPhanAnh,
    PaginatedData,
    RequestType,
    RoleRecord,
} from "@dts";
import { request } from "./request";

export const fetchRoles = (params?: {
    search?: string;
    active?: boolean;
    page?: number;
    limit?: number;
}): Promise<PaginatedData<RoleRecord>> =>
    request<PaginatedData<RoleRecord>>("GET", API.ROLES, params);

export const fetchRolePermissionRegistry = (): Promise<
    ModulePermissionGroup[]
> => request<ModulePermissionGroup[]>("GET", API.ROLES_PERMISSIONS);

export const fetchRoleById = (id: string): Promise<RoleRecord> =>
    request<RoleRecord>("GET", `${API.ROLES}/${id}`);

export interface CreateRoleParams {
    key: string;
    name: string;
    description?: string;
    permissions: string[];
    allowedComplaintCategories?: NhomPhanAnh[];
    allowedRequestTypes?: RequestType[];
    active?: boolean;
    sortOrder?: number;
}

export const createRole = (params: CreateRoleParams): Promise<RoleRecord> =>
    request<RoleRecord>("POST", API.ROLES, params);

export interface UpdateRoleParams {
    name?: string;
    description?: string;
    permissions?: string[];
    allowedComplaintCategories?: NhomPhanAnh[] | null;
    allowedRequestTypes?: RequestType[] | null;
    active?: boolean;
    sortOrder?: number;
}

export const updateRole = (
    id: string,
    params: UpdateRoleParams,
): Promise<RoleRecord> =>
    request<RoleRecord>("PATCH", `${API.ROLES}/${id}`, params);

export const deleteRole = (id: string): Promise<{ key: string }> =>
    request<{ key: string }>("DELETE", `${API.ROLES}/${id}`);
