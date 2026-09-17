import { API, DEFAULT_PAGE_SIZE } from "@constants/common";
import {
    PaginatedData,
    PasswordResetRequest,
    TrangThaiYeuCauDatLaiMatKhau,
} from "@dts";
import { request } from "./request";

export interface CreatePasswordResetRequestInput {
    phone: string;
    note?: string;
}

// Public - goi truoc khi dang nhap (nguoi dung quen mat khau), khong dinh kem
// token du co san trong store (xem request() useAuth mac dinh true - o day
// khong sao vi luc goi tren man dang nhap chua he co token).
export const createPasswordResetRequest = (
    input: CreatePasswordResetRequestInput,
): Promise<null> =>
    request<null>("POST", API.PASSWORD_RESET_REQUESTS, input);

export const fetchPasswordResetRequests = (params?: {
    page?: number;
    limit?: number;
    status?: TrangThaiYeuCauDatLaiMatKhau;
    search?: string;
}): Promise<PaginatedData<PasswordResetRequest>> =>
    request<PaginatedData<PasswordResetRequest>>(
        "GET",
        API.PASSWORD_RESET_REQUESTS,
        {
            page: params?.page || 1,
            limit: params?.limit || DEFAULT_PAGE_SIZE,
            status: params?.status,
            search: params?.search,
        },
    );

export const updatePasswordResetRequestStatus = (
    id: string,
    status: TrangThaiYeuCauDatLaiMatKhau,
): Promise<PasswordResetRequest> =>
    request<PasswordResetRequest>(
        "PATCH",
        `${API.PASSWORD_RESET_REQUESTS}/${id}/status`,
        { status },
    );

// Tu sinh mat khau ngau nhien va dat lai ngay cho tai khoan khop so dien
// thoai cua yeu cau nay - tra ve ca mat khau (chi lan nay, khong con o danh
// sach) de nhan vien co the bao mieng/goi dien them, ben canh viec cong dan
// tu lay qua man "Quen mat khau" (chua co SMS/Zalo OA that).
export const resetPasswordResetRequestPassword = (
    id: string,
): Promise<{ request: PasswordResetRequest; plainPassword: string }> =>
    request<{ request: PasswordResetRequest; plainPassword: string }>(
        "POST",
        `${API.PASSWORD_RESET_REQUESTS}/${id}/reset`,
    );
