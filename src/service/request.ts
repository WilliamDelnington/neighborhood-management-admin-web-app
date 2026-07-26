import { BASE_URL } from "@constants/common";
import { ApiResponse } from "@dts";
import { useAuthStore } from "@store/authStore";

interface FetchOptions {
    useAuth?: boolean;
    baseUrl?: string;
}

export class RequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "RequestError";
        this.status = status;
    }
}

export async function request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: any,
    options?: FetchOptions,
): Promise<T> {
    const { useAuth = true, baseUrl = BASE_URL } = options || {};
    const headers = new Headers();
    const { token } = useAuthStore.getState();

    if (useAuth && token) {
        headers.append("Authorization", `Bearer ${token}`);
    }

    const requestUrl = baseUrl
        ? new URL(url, baseUrl)
        : new URL(url, window.location.origin);
    const requestOptions: { [key: string]: any } = {
        method,
        headers,
    };

    if (method === "GET") {
        if (data) {
            Object.entries(data as Record<string, unknown>).forEach(
                ([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        requestUrl.searchParams.set(key, String(value));
                    }
                },
            );
        }
    } else if (data instanceof FormData) {
        // Khong tu dat Content-Type: trinh duyet can tu sinh boundary cho
        // multipart/form-data, dat thu cong se lam mat boundary va server
        // khong parse duoc formData().
        requestOptions.body = data;
    } else {
        headers.append("Content-Type", "application/json");
        requestOptions.body = JSON.stringify(data ?? {});
    }

    let response: Response;
    try {
        response = await fetch(requestUrl.toString(), requestOptions);
    } catch (err) {
        throw new RequestError("Không kết nối được tới máy chủ");
    }

    const resData = (await response.json()) as ApiResponse<T>;

    if (!resData.success) {
        if (response.status === 401) {
            useAuthStore.getState().logout();
        }
        throw new RequestError(
            resData.error || resData.message || "Đã xảy ra lỗi",
            response.status,
        );
    }

    return resData.data as T;
}
