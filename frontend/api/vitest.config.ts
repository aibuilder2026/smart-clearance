import { defineConfig } from 'vitest/config';

// the contract's mocks and the platform's rules, in node: no browser, no Svelte
export default defineConfig({
	server: { fs: { allow: ['../..'] } },
	test: { environment: 'node', include: ['tests/**/*.test.ts'] }
});
