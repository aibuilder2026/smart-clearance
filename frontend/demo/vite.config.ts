import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// design3 stays the source of truth: its images are referenced in place by core and hashed into the build, never copied
const design3 = fileURLToPath(new URL('../../design3', import.meta.url));

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// the demo runs only in the browser, so nothing is prerendered: every path is the client-side app, served by the
			// index.html fallback (the host rewrites every path to it)
			adapter: adapter({ pages: 'build', assets: 'build', fallback: 'index.html', strict: true }),
			// runes everywhere in our own code; libraries decide for themselves
			dynamicCompileOptions: ({ filename }) =>
				filename.split(/[/\\]/).includes('node_modules') ? undefined : { runes: true }
		})
	],
	server: { port: 5176, strictPort: true, fs: { allow: ['..', design3] } },
	preview: { port: 4178, strictPort: true }
});
