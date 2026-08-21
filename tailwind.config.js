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
                    DEFAULT: "rgb(var(--c-primary) / <alpha-value>)",
                    foreground: "#FFFFFF",
                },
                "primary-dark": "rgb(var(--c-primary-dark) / <alpha-value>)",
                "app-bg": "rgb(var(--c-app-bg) / <alpha-value>)",
                main: "rgb(var(--c-primary) / <alpha-value>)",
                ui_bg: "rgb(var(--c-ui-bg) / <alpha-value>)",
                text_1: "rgb(var(--c-text-1) / <alpha-value>)",
                text_2: "rgb(var(--c-text-2) / <alpha-value>)",
                text_3: "rgb(var(--c-text-3) / <alpha-value>)",
                icon_bg: "rgb(var(--c-primary-soft) / <alpha-value>)",
                blue_10: "rgb(var(--c-primary-soft) / <alpha-value>)",
                ng_10: "rgb(var(--c-surface-2) / <alpha-value>)",
                ng_20: "rgb(var(--c-border-strong) / <alpha-value>)",
                divider_01: "rgb(var(--c-border-strong) / <alpha-value>)",
                divider_02: "rgb(var(--c-border) / <alpha-value>)",
                success: {
                    DEFAULT: "rgb(var(--c-success) / <alpha-value>)",
                    soft: "rgb(var(--c-success-soft) / <alpha-value>)",
                },
                warning: {
                    DEFAULT: "rgb(var(--c-warning) / <alpha-value>)",
                    soft: "rgb(var(--c-warning-soft) / <alpha-value>)",
                },
                danger: {
                    DEFAULT: "rgb(var(--c-danger) / <alpha-value>)",
                    soft: "rgb(var(--c-danger-soft) / <alpha-value>)",
                },
                info: {
                    DEFAULT: "rgb(var(--c-info) / <alpha-value>)",
                    soft: "rgb(var(--c-info-soft) / <alpha-value>)",
                },
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
