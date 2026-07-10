import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@components": path.resolve(__dirname, "src/components"),
            "@constants": path.resolve(__dirname, "src/constants"),
            "@pages": path.resolve(__dirname, "src/pages"),
            "@service": path.resolve(__dirname, "src/service"),
            "@store": path.resolve(__dirname, "src/store"),
            "@utils": path.resolve(__dirname, "src/utils"),
            "@lib": path.resolve(__dirname, "src/lib"),
            "@dts": path.resolve(__dirname, "src/types"),
        },
    },
    server: {
        port: 5173,
    },
});
