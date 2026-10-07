import { read } from '$app/server';
import icon from '../../../../../design3/app/icons/icon-192.png';

// the icon a push shows (service-worker.ts), at an address that does not change between builds: design3's app icon
export const prerender = true;
export const GET = () => read(icon);
