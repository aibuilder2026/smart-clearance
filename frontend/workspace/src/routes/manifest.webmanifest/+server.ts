import { PUBLIC_API_BASE, PUBLIC_WORKSPACE_ID } from '$app/env/public';
import icon192 from '../../../../../design3/app/icons/icon-192.png?url';
import icon512 from '../../../../../design3/app/icons/icon-512.png?url';
import maskable from '../../../../../design3/app/icons/icon-maskable-512.png?url';
import svg from '../../../../../design3/system/img/icon.svg?url';
import type { WorkspacePublic } from '@smart-clearance/api/workspace';

// The installed app's manifest (design3/app/manifest.webmanifest, ported for SC-73), written at build time: the
// workspace's own name and colours, from backend-api's public page for a live build, or from the stub's for a prototype
// build; the icons are design3's, hashed by the build. iOS sends push only to an installed app, so this is what makes
// pushes reach an iPhone.
export const prerender = true;

type Named = { name: string; short: string; platform: string; description?: string; theme?: string; ground?: string };

async function named(): Promise<Named | null> {
	if (PUBLIC_API_BASE && PUBLIC_WORKSPACE_ID) {
		try {
			const r = await fetch(`${PUBLIC_API_BASE}/v1/workspaces/${encodeURIComponent(PUBLIC_WORKSPACE_ID)}`);
			if (!r.ok) return null;
			const p = (await r.json()) as WorkspacePublic;
			return {
				name: p.manifest.name,
				short: p.manifest.shortName,
				platform: p.platform.name,
				description: p.manifest.description,
				theme: p.manifest.themeColor,
				ground: p.manifest.backgroundColor
			};
		} catch {
			return null; // the API is out of reach while building: the platform's own name stands in
		}
	}
	const { stubSource } = await import('@smart-clearance/core/workspace/stub');
	const p = stubSource.publicInfo;
	return p ? { name: `${p.workspace.name} · ${p.platform.name}`, short: 'Clearance', platform: p.platform.name } : null;
}

export async function GET() {
	const n = await named();
	const manifest = {
		name: n?.name ?? 'Smart-Clearance',
		short_name: n?.short ?? 'Clearance',
		description:
			n?.description ??
			`${n?.platform ?? 'Smart-Clearance'}: near-expiry stock routed to the channel that recovers the most, with one human approval.`,
		id: '/',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		display_override: ['window-controls-overlay', 'standalone'],
		orientation: 'any',
		background_color: n?.ground ?? '#f2f6f3',
		theme_color: n?.theme ?? '#167a52',
		lang: 'en-IN',
		categories: ['business', 'productivity'],
		icons: [
			{ src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
			{ src: svg, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
		],
		shortcuts: [
			{ name: 'Command Center', short_name: 'Today', url: '/command', icons: [{ src: icon192, sizes: '192x192' }] },
			{ name: 'Inbox', url: '/inbox', icons: [{ src: icon192, sizes: '192x192' }] }
		]
	};
	return new Response(JSON.stringify(manifest), { headers: { 'content-type': 'application/manifest+json' } });
}
