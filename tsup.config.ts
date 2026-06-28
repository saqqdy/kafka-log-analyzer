import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library entry
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: [],
    outDir: 'dist',
  },
  // CLI entry
  {
    entry: ['src/cli.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    external: [],
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
