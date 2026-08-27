import { create } from "zustand";
import { fetchPublicSettings } from "@service/settingsApi";

// Cache dung chung o cap app cho "section_descriptions" (mo ta tuy chinh
// khong-can-sua-code cho tung mo-dun trong constants/modules.ts - xem
// SettingsPage.tsx). Truoc day AdminLayout.tsx tu fetch rieng bang useState
// cuc bo; PageHeader.tsx gio cung can doc cung du lieu nay o moi trang, nen
// gom vao 1 store de chi fetch 1 lan cho ca phien lam viec thay vi moi noi
// tu goi fetchPublicSettings().
interface SectionDescriptionsState {
    overrides: Record<string, string>;
    loaded: boolean;
    loading: boolean;
    load: () => void;
    setOverrides: (overrides: Record<string, string>) => void;
}

export const useSectionDescriptionsStore = create<SectionDescriptionsState>()(
    (set, get) => ({
        overrides: {},
        loaded: false,
        loading: false,
        load: () => {
            if (get().loaded || get().loading) return;
            set({ loading: true });
            fetchPublicSettings()
                .then(data => {
                    const raw = data?.section_descriptions;
                    set({
                        overrides:
                            raw && typeof raw === "object"
                                ? (raw as Record<string, string>)
                                : {},
                        loaded: true,
                        loading: false,
                    });
                })
                .catch(() => set({ loaded: true, loading: false }));
        },
        // Goi ngay sau khi SettingsPage luu/khoi phuc mo ta - cap nhat cache
        // tai cho de cac trang khac phan anh ngay, khong can doi lan
        // fetchPublicSettings tiep theo (vi loaded da la true, load() se
        // khong tu goi lai).
        setOverrides: overrides => set({ overrides, loaded: true }),
    }),
);
