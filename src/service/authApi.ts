import { API } from "@constants/common";
import { FileAsset, User } from "@dts";
import { request } from "./request";
import { UserManagementScopeEntry } from "./userApi";

export interface LoginWithPhoneParams {
    phone: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export const loginWithPhone = (
    params: LoginWithPhoneParams,
): Promise<LoginResponse> =>
    request<LoginResponse>("POST", API.AUTH_LOGIN, params, {
        useAuth: false,
    });

export const fetchMe = (): Promise<User> => request<User>("GET", API.AUTH_ME);

export const setPassword = (
    password: string,
    currentPassword?: string,
): Promise<User> =>
    request<User>("POST", API.AUTH_SET_PASSWORD, {
        password,
        currentPassword,
    });

export const logout = (): Promise<null> =>
    request<null>("POST", API.AUTH_LOGOUT);

export interface UpdateMyProfileParams {
    email?: string;
    address?: string;
    // idNumber KHONG nam trong CHANGE_REQUEST_EDITABLE_FIELDS.User (chi
    // "displayName") nen duoc sua truc tiep o day - xem updateProfileSchema o
    // backend. displayName KHONG duoc phep tu sua qua endpoint nay.
    idNumber?: string;
}

export const updateMyProfile = (params: UpdateMyProfileParams): Promise<User> =>
    request<User>("PATCH", API.AUTH_ME, params);

/** Trang "Hồ sơ của tôi" (MyProfilePage.tsx) - tu tai anh dai dien cho chinh minh. */
export const uploadMyAvatar = (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<User>("POST", `${API.AUTH_ME}/avatar`, formData);
};

export const fetchMyAttachments = (): Promise<FileAsset[]> =>
    request<FileAsset[]>("GET", `${API.AUTH_ME}/attachments`);

export const uploadMyAttachment = (file: File): Promise<FileAsset> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<FileAsset>("POST", `${API.AUTH_ME}/attachments`, formData);
};

export const deleteMyAttachment = (fileId: string): Promise<null> =>
    request<null>("DELETE", `${API.AUTH_ME}/attachments/${fileId}`);

export const fetchMyManagementScope = (): Promise<{
    scopes: UserManagementScopeEntry[];
}> =>
    request<{ scopes: UserManagementScopeEntry[] }>(
        "GET",
        `${API.AUTH_ME}/management-scope`,
    );
