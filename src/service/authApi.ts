import { API } from "@constants/common";
import { User } from "@dts";
import { request } from "./request";

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
