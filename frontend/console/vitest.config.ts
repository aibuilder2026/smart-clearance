import { defineConfig } from 'vitest/config';

// unit tests of what the console shares and ports (its stylesheet, its HTML shell, its cascade); the e2e and parity
// suites are Playwright's
export default defineConfig({
	server: { fs: { allow: ['../..'] } },
	test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
