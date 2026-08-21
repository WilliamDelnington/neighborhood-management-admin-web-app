import { create } from "zustand";

const THEME_STORAGE_KEY = "hb_admin_theme";

export type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

function getInitialTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

// index.html chay san mot script inline giong logic getInitialTheme() de gan
// class "dark" truoc khi React mount (tranh nhap nhay sai theme luc tai
// trang) - o day chi can doc lai gia tri da luu de dong bo state.
export const useThemeStore = create<ThemeState>()(set => ({
    theme: getInitialTheme(),
    setTheme: theme => {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        applyTheme(theme);
        set({ theme });
    },
    toggleTheme: () =>
        set(state => {
            const next: Theme = state.theme === "dark" ? "light" : "dark";
            localStorage.setItem(THEME_STORAGE_KEY, next);
            applyTheme(next);
            return { theme: next };
        }),
}));
