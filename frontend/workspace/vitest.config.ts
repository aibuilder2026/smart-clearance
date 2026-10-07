import { defineConfig } from 'vitest/config';

// unit tests of what the workspace app shares with the rest of the frontend (its HTML shell, its cascade)
export default defineConfig({
	server: { fs: { allow: ['../..'] } },
	test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
