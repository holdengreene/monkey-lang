import { build } from "esbuild";

await build({
    entryPoints: ["index.ts"],
    outdir: "dist",
    bundle: true,
    platform: "node",
    target: "esnext",
    format: "esm",
    minify: true,
    logLevel: "info",
}).catch(() => process.exit(1));
