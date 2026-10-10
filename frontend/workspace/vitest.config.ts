import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// unit tests of what the workspace app shares with the rest of the frontend (its HTML shell, its cascade), in node; and
// the live source's tests (SC-73), which draw the screens in jsdom on what backend-api answered (tests/live/fixtures).
// As a live build does (vite.config.ts), they carry none of the story's photos, so a screen draws what production draws
export default defineConfig({
	plugins: [svelte({ configFile: false }), svelteTesting()],
	resolve: {
		alias: [
			{
				find: /^\.\/story-photos\.ts$/,
				replacement: fileURLToPath(new URL('./src/lib/no-story-photos.ts', import.meta.url))
			}
		]
	},
	server: { fs: { allow: ['../..'] } },
	test: {
		include: ['tests/unit/**/*.test.ts', 'tests/live/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['tests/live/setup.ts']
	}
});
