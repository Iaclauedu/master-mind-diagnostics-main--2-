import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Vercel deployment: TanStack Start + Nitro Vercel preset
// Nitro emits to `.vercel/output` (Build Output API v3).
const isVercelBuild = process.env.VERCEL === "1";

export default defineConfig({
  cloudflare: false,
  vite: {
    plugins: isVercelBuild ? [nitro()] : [],
  },
});
