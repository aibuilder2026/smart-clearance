import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// design3 stays the source of truth: its plates and renders are imported in place and hashed into the build, never copied
const design3 = fileURLToPath(new URL('../../design3', import.meta.url));

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// "/" is prerendered with its data; every other route is a client-side app served by the 200.html fallback
			// (index.html is the prerendered landing page, so the fallback cannot take that name)
			adapter: adapter({ pages: 'build', assets: 'build', fallback: '200.html', strict: true }),
			prerender: { entries: ['/'], handleMissingId: 'fail', handleHttpError: 'fail' },
			// runes everywhere in our own code; libraries decide for themselves
			dynamicCompileOptions: ({ filename }) =>
				filename.split(/[/\\]/).includes('node_modules') ? undefined : { runes: true }
		})
	],
	resolve: { alias: { $design3: design3 } },
	server: { port: 5173, strictPort: true, fs: { allow: ['..', design3] } },
	preview: { port: 4173, strictPort: true }
});
