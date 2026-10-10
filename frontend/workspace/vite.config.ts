import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

const live = (mode: string) =>
	!!(process.env.PUBLIC_API_BASE || loadEnv(mode, process.cwd(), 'PUBLIC_').PUBLIC_API_BASE);

// design3 stays the source of truth: its images are referenced in place by core and hashed into the build, never copied
const design3 = fileURLToPath(new URL('../../design3', import.meta.url));

export default defineConfig(({ mode }) => ({
	// a live build (PUBLIC_API_BASE set) reads everything from backend-api: the prototype's stub, with Munchly's whole
	// seed, and the story's photos (core's story-photos.ts, named for its batches) are replaced by empty modules, so they
	// cannot end up in the bundle (scripts/no-seed.mjs checks the build)
	// $design3: the live build's splash (hooks.server.ts) is read from design3 in place
	resolve: {
		alias: [
			{ find: '$design3', replacement: design3 },
			...(live(mode)
				? [
						{
							find: '@smart-clearance/core/workspace/stub',
							replacement: fileURLToPath(new URL('./src/lib/no-stub.ts', import.meta.url))
						},
						{
							find: /^\.\/story-photos\.ts$/,
							replacement: fileURLToPath(new URL('./src/lib/no-story-photos.ts', import.meta.url))
						}
					]
				: [])
		]
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			// the workspace is behind a sign-in, so nothing is prerendered: every route is the client-side app, served by the
			// index.html fallback (the host rewrites every path to it)
			adapter: adapter({ pages: 'build', assets: 'build', fallback: 'index.html', strict: true }),
			// a live build registers the service worker itself (src/lib/live/push.svelte.ts); the prototype has none
			serviceWorker: { register: false },
			// runes everywhere in our own code; libraries decide for themselves
			dynamicCompileOptions: ({ filename }) =>
				filename.split(/[/\\]/).includes('node_modules') ? undefined : { runes: true }
		})
	],
	server: { port: 5175, strictPort: true, fs: { allow: ['..', design3] } },
	preview: { port: 4177, strictPort: true }
}));
