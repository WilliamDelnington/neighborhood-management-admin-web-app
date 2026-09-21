import { create } from "zustand";

// Cung quy uoc voi EXPANDED_GROUPS_STORAGE_KEY trong AdminLayout.tsx - doc/ghi
// localStorage truc tiep (chua dung zustand persist middleware o dau trong
// app nay).
const PINNED_MODULES_STORAGE_KEY = "hb_admin_pinned_modules";

// Gioi han so muc duoc ghim - tranh khu vuc "Da ghim" phinh to lam mat y
// nghia "rut gon menu" ma tinh nang nay huong toi. Ghim moi khi da day se
// tu dong bo muc CU NHAT (FIFO), khong bao loi/chan nguoi dung.
const MAX_PINNED = 8;

function loadPinned(): string[] {
    try {
        const raw = localStorage.getItem(PINNED_MODULES_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

function savePinned(keys: string[]): void {
    localStorage.setItem(PINNED_MODULES_STORAGE_KEY, JSON.stringify(keys));
}

export interface PinnedModulesState {
    pinnedKeys: string[];
    isPinned: (key: string) => boolean;
    toggle: (key: string) => void;
}

export const usePinnedModulesStore = create<PinnedModulesState>()((set, get) => ({
    pinnedKeys: loadPinned(),
    isPinned: key => get().pinnedKeys.includes(key),
    toggle: key =>
        set(state => {
            const next = state.pinnedKeys.includes(key)
                ? state.pinnedKeys.filter(k => k !== key)
                : [...state.pinnedKeys, key].slice(-MAX_PINNED);
            savePinned(next);
            return { pinnedKeys: next };
        }),
}));
