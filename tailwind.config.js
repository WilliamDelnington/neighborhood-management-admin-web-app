/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        container: {
            center: true,
            padding: "1rem",
        },
        extend: {
            fontFamily: {
                sans: [
                    '"Be Vietnam Pro"',
                    "Inter",
                    "system-ui",
                    "-apple-system",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
            },
            colors: {
                primary: {
                    DEFAULT: "#1E5A8A",
                    foreground: "#FFFFFF",
                },
                "primary-dark": "#163A5F",
                "app-bg": "#F4F6F8",
                main: "#1E5A8A",
                ui_bg: "#FFFFFF",
                text_1: "#17212B",
                text_2: "#64748B",
                text_3: "#94A3B8",
                icon_bg: "#EAF2F8",
                blue_10: "#EAF2F8",
                ng_10: "#F8FAFC",
                ng_20: "#DFE5EB",
                divider_01: "#DFE5EB",
                divider_02: "#EEF1F4",
                success: { DEFAULT: "#16803C", soft: "#D7F0DE" },
                warning: { DEFAULT: "#C77800", soft: "#F7E4BC" },
                danger: { DEFAULT: "#C83232", soft: "#F7D6D6" },
                info: { DEFAULT: "#2563EB", soft: "#D9E9F8" },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
