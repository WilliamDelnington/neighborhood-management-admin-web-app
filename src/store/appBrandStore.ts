import { create } from "zustand";
import { fetchPublicSettings } from "@service/settingsApi";

// Cache dung chung o cap app cho cac Setting cong khai dieu khien thuong hieu
// hien thi: "app_logo_url" (AppBrand.tsx - logo header/trang dang nhap),
// "app_tab_title" va "app_favicon_url" (DocumentMeta.tsx - tieu de/icon tab
// trinh duyet). Gom vao 1 store (giong sectionDescriptionsStore.ts) de chi
// fetchPublicSettings() 1 lan cho ca phien thay vi moi component tu goi rieng.
interface AppBrandState {
    logoUrl: string | null;
    tabTitle: string | null;
    faviconUrl: string | null;
    loaded: boolean;
    loading: boolean;
    load: () => void;
    setBrand: (
        partial: Partial<{
            logoUrl: string | null;
            tabTitle: string | null;
            faviconUrl: string | null;
        }>,
    ) => void;
}

const asNonEmptyString = (value: unknown): string | null =>
    typeof value === "string" && value ? value : null;

export const useAppBrandStore = create<AppBrandState>()((set, get) => ({
    logoUrl: null,
    tabTitle: null,
    faviconUrl: null,
    loaded: false,
    loading: false,
    load: () => {
        if (get().loaded || get().loading) return;
        set({ loading: true });
        fetchPublicSettings()
            .then(data => {
                set({
                    logoUrl: asNonEmptyString(data?.app_logo_url),
                    tabTitle: asNonEmptyString(data?.app_tab_title),
                    faviconUrl: asNonEmptyString(data?.app_favicon_url),
                    loaded: true,
                    loading: false,
                });
            })
            .catch(() => set({ loaded: true, loading: false }));
    },
    // Goi ngay sau khi SettingsPage tai/xoa logo, luu tieu de tab hoac favicon
    // - cap nhat cache tai cho de header/tab phan anh ngay, khong can doi lan
    // fetchPublicSettings tiep theo (vi loaded da la true, load() se khong tu
    // goi lai).
    setBrand: partial => set({ ...partial, loaded: true }),
}));
