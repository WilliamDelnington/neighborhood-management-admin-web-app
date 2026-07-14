import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import { AssignableStaff, PaginatedData, Role, User } from "@dts";
import { request } from "./request";

/**
 * Danh sach rut gon nhan vien co the duoc gan phu trach phan anh - mo cho ca 4 vai
 * tro duoc phep gan (khong chi admin), tra ve toi thieu du lieu (id, displayName).
 */
export const fetchAssignableStaff = (): Promise<AssignableStaff[]> =>
    request<AssignableStaff[]>("GET", API.USERS_ASSIGNABLE_STAFF);

export const fetchUsers = (
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search: string | undefined = undefined,
    role: Role | undefined = undefined,
): Promise<PaginatedData<User>> =>
    request<PaginatedData<User>>("GET", API.USERS, {
        page,
        limit,
        search,
        role,
    });

export const fetchUserById = (id: string): Promise<User> =>
    request<User>("GET", `${API.USERS}/${id}`);

export interface UpdateUserParams {
    displayName?: string;
    phone?: string;
    status?: "active" | "pending" | "locked";
    householdId?: string | null;
    citizenId?: string | null;
    assignedClusters?: string[];
    primaryRole?: Role;
}

export const updateUser = (
    id: string,
    params: UpdateUserParams,
): Promise<User> => request<User>("PATCH", `${API.USERS}/${id}`, params);

export const revokeUserSession = (id: string): Promise<null> =>
    request<null>("POST", `${API.USERS}/${id}/revoke-session`);

export const assignUserRole = (
    userId: string,
    role: Role,
    scopeType: "all" | "cluster" | "household" | "complaint" | "module" = "all",
    scopeValues: string[] = [],
): Promise<unknown> =>
    request("POST", API.ROLES_ASSIGN, { userId, role, scopeType, scopeValues });

export const revokeUserRole = (userId: string, role: Role): Promise<User> =>
    request<User>("POST", API.ROLES_REVOKE, { userId, role });
