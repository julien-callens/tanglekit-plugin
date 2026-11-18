import {build} from "esbuild";

await build({
    entryPoints: ["src/extension.mjs"],
    outfile: "dist/extension.cjs",
    platform: "browser",
    format: "cjs",
    bundle: true,
    minify: true,
    external: ["vscode"],
    plugins: [{
        name: "parser-only",
        setup(build) {
            // The compiler also exports Vite integration and JS formatting. Neither runs in the editor.
            build.onResolve({filter: /^(node:path|node:fs\/promises|prettier)$/}, args => ({
                path: args.path, external: true, sideEffects: false,
            }));
        },
    }],
});
