import { create } from "zustand";
import { User } from "@dts";

const TOKEN_STORAGE_KEY = "hb_admin_token";

export interface AuthState {
    token?: string;
    user?: User;
    /** true trong luc kiem tra token da luu (goi fetchMe) khi app vua mo */
    bootstrapping: boolean;
    setToken: (token?: string) => void;
    setUser: (user?: User) => void;
    setBootstrapping: (value: boolean) => void;
    logout: () => void;
}

export function usePermission(permission: string): boolean {
    return useAuthStore(state => !!state.user?.permissions.includes(permission));
}

/**
 * Neu user dang dang nhap bi "khoa cung" vao DUY NHAT 1 to dan pho (To
 * truong/To pho voi neighborhoodId hoac dung 1 assignedNeighborhoodIds), tra
 * ve id do - cac trang danh sach (House/Household/Citizen) dung gia tri nay de
 * AN bo loc "Tổ dân phố" (chon loc giua nhieu to dan pho la vo nghia khi user
 * chi bao gio thay du lieu cua dung 1 to). null neu user khong bi khoa cung
 * vao 1 to duy nhat (admin, vai tro cap Phuong, hoac duoc gan NHIEU to dan pho
 * - vd To pho quan ly nhieu to - van can bo loc de phan biet giua cac to do).
 */
export function useLockedNeighborhoodId(): string | null {
    return useAuthStore(state => {
        const user = state.user;
        if (!user || user.roles.includes("admin")) return null;
        const ids = [
            user.neighborhoodId,
            ...(user.assignedNeighborhoodIds || []),
        ].filter((id): id is string => !!id);
        const uniqueIds = [...new Set(ids)];
        return uniqueIds.length === 1 ? uniqueIds[0] : null;
    });
}

/**
 * Tuong tu useLockedNeighborhoodId nhung cho pham vi Phuong/Xa (Bi thu/Can bo
 * UBND/Cong an khu vuc) - cac vai tro nay chi giu 1 wardCode duy nhat (khong
 * co khai niem "nhieu Phuong cung luc" nhu assignedNeighborhoodIds), nen chi
 * can doc thang truong nay.
 */
export function useLockedWardCode(): number | null {
    return useAuthStore(state => {
        const user = state.user;
        if (!user || user.roles.includes("admin")) return null;
        return user.wardCode ?? null;
    });
}

export const useAuthStore = create<AuthState>()(set => ({
    token: localStorage.getItem(TOKEN_STORAGE_KEY) || undefined,
    user: undefined,
    bootstrapping: true,
    setToken: (token?: string) => {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        set(state => ({ ...state, token }));
    },
    setUser: (user?: User) => set(state => ({ ...state, user })),
    setBootstrapping: (value: boolean) =>
        set(state => ({ ...state, bootstrapping: value })),
    logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set(state => ({ ...state, token: undefined, user: undefined }));
    },
}));
