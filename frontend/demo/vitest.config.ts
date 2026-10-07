import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// unit tests of what the demo shares with design3 and the rest of the frontend (its stylesheet, its HTML shell, its
// cascade) and of its stages, which read core's workspace app (Svelte, hence the plugin)
export default defineConfig({
	plugins: [svelte({ configFile: false })],
	server: { fs: { allow: ['../..'] } },
	test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
