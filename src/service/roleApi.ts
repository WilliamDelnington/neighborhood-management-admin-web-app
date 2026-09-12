import { API } from "@constants/common";
import {
    AccessScopeTier,
    DashboardMetricKey,
    ModulePermissionGroup,
    NeighborhoodCollaboratorScope,
    NhomPhanAnh,
    PaginatedData,
    RequestType,
    RoleRecord,
    ScopeAssignmentMechanism,
} from "@dts";
import { request } from "./request";

// Dung chung boi CreateRoleParams/UpdateRoleParams - xem RoleRecord.scopeType
// trong types/index.ts de biet y nghia tung truong.
interface RoleScopeFields {
    scopeType?: AccessScopeTier;
    scopeMechanism?: ScopeAssignmentMechanism;
    maxActivePerScope?: number | null;
    maxActiveScopesPerUser?: number | null;
    subScopeKinds?: NeighborhoodCollaboratorScope[];
}

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

export interface CreateRoleParams extends RoleScopeFields {
    key: string;
    name: string;
    description?: string;
    permissions: string[];
    allowedComplaintCategories?: NhomPhanAnh[];
    allowedRequestTypes?: RequestType[];
    dashboardMetrics?: DashboardMetricKey[];
    allowedCreatableRoles?: string[];
    active?: boolean;
    sortOrder?: number;
}

export const createRole = (params: CreateRoleParams): Promise<RoleRecord> =>
    request<RoleRecord>("POST", API.ROLES, params);

export interface UpdateRoleParams extends RoleScopeFields {
    name?: string;
    description?: string;
    permissions?: string[];
    allowedComplaintCategories?: NhomPhanAnh[] | null;
    allowedRequestTypes?: RequestType[] | null;
    dashboardMetrics?: DashboardMetricKey[] | null;
    allowedCreatableRoles?: string[];
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
