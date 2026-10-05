import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// design3 stays the source of truth: the sign-in plate is imported in place and hashed into the build, never copied
const design3 = fileURLToPath(new URL('../../design3', import.meta.url));

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// the console is behind a sign-in, so nothing is prerendered: every route is the client-side app, served by the
			// index.html fallback (the host rewrites every path to it; see ../firebase.json)
			adapter: adapter({ pages: 'build', assets: 'build', fallback: 'index.html', strict: true }),
			// runes everywhere in our own code; libraries decide for themselves
			dynamicCompileOptions: ({ filename }) =>
				filename.split(/[/\\]/).includes('node_modules') ? undefined : { runes: true }
		})
	],
	resolve: { alias: { $design3: design3 } },
	server: { port: 5174, strictPort: true, fs: { allow: ['..', design3] } },
	preview: { port: 4176, strictPort: true }
});
