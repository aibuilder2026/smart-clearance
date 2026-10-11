// YouTube's IFrame API, for the demo film's theatre (SC-164): loaded once, and only after the first Watch, so the page
// asks nothing of YouTube before then. The player is made on YouTube's no-cookie host.

/** the part of YT.Player the theatre uses */
export type YouTubePlayer = {
	getIframe(): HTMLIFrameElement;
	getCurrentTime(): number;
	seekTo(seconds: number, allowSeekAhead: boolean): void;
	playVideo(): void;
	destroy(): void;
};
type PlayerOptions = {
	host: string;
	videoId: string;
	width: string;
	height: string;
	playerVars: Record<string, number>;
	events: { onReady?: (e: { target: YouTubePlayer }) => void; onStateChange?: (e: { data: number }) => void };
};
export type YouTubeApi = { Player: new (el: HTMLElement, options: PlayerOptions) => YouTubePlayer };

declare global {
	interface Window {
		YT?: YouTubeApi;
		onYouTubeIframeAPIReady?: () => void;
	}
}

/** YouTube's state for a film that has ended */
export const ENDED = 0;

let api: Promise<YouTubeApi> | null = null;
export function loadYouTube(): Promise<YouTubeApi> {
	return (api ??= new Promise((resolve) => {
		if (window.YT?.Player) return resolve(window.YT);
		const prev = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			prev?.();
			resolve(window.YT!);
		};
		const s = document.createElement('script');
		s.src = 'https://www.youtube.com/iframe_api';
		s.async = true;
		document.head.appendChild(s);
	}));
}

/** the film on YouTube's no-cookie host in `el`: it plays at once, reports its end, and is titled for the reader */
export function filmPlayer(api: YouTubeApi, el: HTMLElement, videoId: string, onend: () => void): YouTubePlayer {
	return new api.Player(el, {
		host: 'https://www.youtube-nocookie.com',
		videoId,
		width: '100%',
		height: '100%',
		playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
		events: {
			onReady: (e) => {
				e.target.getIframe().title = 'Smart-Clearance demo film';
			},
			onStateChange: (e) => {
				if (e.data === ENDED) onend();
			}
		}
	});
}

/** which chapter a time falls in, by the chapters' starts */
export const chapterAt = (t: number, starts: number[]) => {
	let i = 0;
	while (i + 1 < starts.length && t >= starts[i + 1]) i += 1;
	return i;
};
/** m:ss */
export const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
