import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    AssignableStaff,
    PaginatedData,
    ResidentSearchResult,
    Role,
    User,
} from "@dts";
import { request } from "./request";

/**
 * Danh sach rut gon nhan vien co the duoc gan phu trach mot loai viec - mo cho
 * bat ky vai tro nao dang giu permission truyen vao (khong chi admin), tra ve
 * toi thieu du lieu (id, displayName). Mac dinh "complaints.assign" de tuong
 * thich cac noi da goi ham nay truoc khi co tham so nay.
 */
export const fetchAssignableStaff = (
    permission = "complaints.assign",
): Promise<AssignableStaff[]> =>
    request<AssignableStaff[]>("GET", API.USERS_ASSIGNABLE_STAFF, {
        permission,
    });

/**
 * Bien the theo danh sach vai tro cu the thay vi mot permission - dung khi da
 * biet chinh xac tap vai tro hop le (vd CorrespondenceType.allowedReceiverRoles),
 * vi correspondences.* la permission chung cho ca hai chieu gui/nhan nen
 * khong con dai dien cho "ai duoc nhan LOAI VAN BAN NAY" (xem
 * app/api/users/assignable-staff/route.ts o backend).
 */
export const fetchAssignableStaffByRoles = (
    roles: Role[],
): Promise<AssignableStaff[]> =>
    roles.length === 0
        ? Promise.resolve([])
        : request<AssignableStaff[]>("GET", API.USERS_ASSIGNABLE_STAFF, {
              roles: roles.join(","),
          });

/**
 * Tim chu ho theo ten/so dien thoai - dung cho man chon "nguoi nhan cu the"
 * khi gui Thong bao.
 */
export const searchResidentUsers = (
    search: string,
): Promise<ResidentSearchResult[]> =>
    request<ResidentSearchResult[]>("GET", API.USERS_SEARCH_RESIDENTS, {
        search,
    });

/** "Resolve nguoc" mot danh sach userId da luu san thanh id+displayName+phone. */
export const fetchResidentUsersByIds = (
    ids: string[],
): Promise<ResidentSearchResult[]> =>
    ids.length === 0
        ? Promise.resolve([])
        : request<ResidentSearchResult[]>("GET", API.USERS_SEARCH_RESIDENTS, {
              ids: ids.join(","),
          });

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

export const fetchWardManagers = (): Promise<User[]> =>
    request<User[]>("GET", API.WARD_MANAGERS);

export interface UpdateUserParams {
    displayName?: string;
    phone?: string;
    status?: "active" | "pending" | "locked";
    // Bat buoc khi status co mat trong payload (khoa/mo tai khoan) - xem
    // updateUserSchema o backend.
    statusReason?: string;
    householdId?: string | null;
    citizenId?: string | null;
    assignedClusters?: string[];
    primaryRole?: Role;
    provinceCode?: number | null;
    provinceName?: string | null;
    wardCode?: number | null;
    wardName?: string | null;
}

export const updateUser = (
    id: string,
    params: UpdateUserParams,
): Promise<User> => request<User>("PATCH", `${API.USERS}/${id}`, params);

export const revokeUserSession = (id: string): Promise<null> =>
    request<null>("POST", `${API.USERS}/${id}/revoke-session`);

/**
 * Dat lai mat khau cho MOT tai khoan bat ky (khac doi mat khau cua chinh
 * minh) - quyen rieng "users.reset_password", gioi han theo pham vi to dan
 * pho neu actor la to truong/to pho (giong users.lock) - xem POST
 * /api/users/:id/reset-password o backend. Tu dong thu hoi phien dang nhap
 * cu cua tai khoan do (sessionVersion +1).
 */
export const resetUserPassword = (
    id: string,
    password: string,
): Promise<null> =>
    request<null>("POST", `${API.USERS}/${id}/reset-password`, { password });

/**
 * Khoa/mo tai khoan chu nha - quyen HEP hon updateUser (users.update):
 * chi doi status, gioi han theo pham vi to dan pho neu actor la to truong
 * (users.lock, khong phai users.update) - xem PATCH /api/users/:id/lock o
 * backend. Dung tu HouseOwnershipPanel.tsx thay vi UserListPage (khong doi
 * hoi users.read, tranh lo toan bo danh sach nguoi dung he thong).
 */
export const lockUserAccount = (
    id: string,
    status: "active" | "locked",
    statusReason: string,
): Promise<User> =>
    request<User>("PATCH", `${API.USERS}/${id}/lock`, { status, statusReason });

// house_owner mo cho bat ky ai co quyen "users.create"; 3 vai tro con lai
// CHI admin moi duoc chon (kiem tra o backend, xem userService.createHouseOwnerByStaff).
export type CreatableStaffRole =
    | "house_owner"
    | "neighborhood_leader"
    | "neighborhood_coleader"
    | "neighborhood_collaborator";

export interface CreateHouseOwnerParams {
    phone: string;
    displayName: string;
    address?: string;
    idNumber: string;
    role?: CreatableStaffRole;
    // TAM THOI: dat mat khau luc tao (thay OTP/Zalo, hien chua san sang do can
    // duyet mau tin truoc - xem LoginPage.tsx o mini app).
    password?: string;
}

export const createHouseOwner = (
    params: CreateHouseOwnerParams,
): Promise<User> => request<User>("POST", API.USERS, params);

export const assignUserRole = (
    userId: string,
    role: Role,
    scopeType: "all" | "cluster" | "household" | "complaint" | "module" = "all",
    scopeValues: string[] = [],
): Promise<unknown> =>
    request("POST", API.ROLES_ASSIGN, { userId, role, scopeType, scopeValues });

export const revokeUserRole = (userId: string, role: Role): Promise<User> =>
    request<User>("POST", API.ROLES_REVOKE, { userId, role });
