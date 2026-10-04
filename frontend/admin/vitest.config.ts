import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// unit tests of the app's own modules (figures, the pan, the mock API, the ported stylesheet); the e2e suite is
// Playwright's (playwright.config.ts)
export default defineConfig({
	plugins: [svelte({ configFile: false })],
	server: { fs: { allow: ['../..'] } },
	test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
