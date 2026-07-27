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
