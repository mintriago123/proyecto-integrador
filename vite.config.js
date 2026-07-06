import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api/worldbank": {
                target: "https://api.worldbank.org",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/worldbank/, "/v2"),
            },
        },
    },
});
