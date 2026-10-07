// Server-sent events, read from a fetch body (SC-73): EventSource cannot send the Authorization header backend-api
// needs, so the workspace reads the stream itself. This parser follows the HTML standard's event-stream rules: lines
// end in CR, LF or CRLF; a blank line dispatches; `data` lines join with LF; `id` persists until changed; a line
// starting with ':' is a comment; an event with no data is not dispatched.

export type SseMessage = { id: string | null; event: string; data: string };

export type SseParser = {
	/** the next chunk of the stream, as text */
	push(chunk: string): void;
	/** the reconnection time the server asked for, if it did */
	readonly retry: number | null;
	/** the last event id the stream set */
	readonly lastId: string | null;
};

export function sseParser(onMessage: (m: SseMessage) => void, onComment?: (text: string) => void): SseParser {
	let buffer = '';
	let lastId: string | null = null;
	let retry: number | null = null;
	let event = '';
	let data: string[] = [];
	let hasData = false;
	// a CR at the end of a chunk may be the first half of a CRLF
	let pendingCR = false;

	function line(text: string) {
		if (text === '') {
			if (hasData) onMessage({ id: lastId, event: event || 'message', data: data.join('\n') });
			event = '';
			data = [];
			hasData = false;
			return;
		}
		if (text.startsWith(':')) {
			onComment?.(text.slice(1).trimStart());
			return;
		}
		const colon = text.indexOf(':');
		const field = colon < 0 ? text : text.slice(0, colon);
		let value = colon < 0 ? '' : text.slice(colon + 1);
		if (value.startsWith(' ')) value = value.slice(1);
		if (field === 'data') {
			data.push(value);
			hasData = true;
		} else if (field === 'event') event = value;
		else if (field === 'id') {
			if (!value.includes('\0')) lastId = value;
		} else if (field === 'retry' && /^\d+$/.test(value)) retry = Number(value);
	}

	return {
		push(chunk) {
			if (pendingCR && chunk.startsWith('\n')) chunk = chunk.slice(1);
			pendingCR = false;
			buffer += chunk;
			for (;;) {
				const at = buffer.search(/[\r\n]/);
				if (at < 0) break;
				const cr = buffer[at] === '\r';
				if (cr && at === buffer.length - 1) {
					// the CR ends this chunk: its LF, if any, starts the next
					line(buffer.slice(0, at));
					buffer = '';
					pendingCR = true;
					break;
				}
				line(buffer.slice(0, at));
				buffer = buffer.slice(at + (cr && buffer[at + 1] === '\n' ? 2 : 1));
			}
		},
		get retry() {
			return retry;
		},
		get lastId() {
			return lastId;
		}
	};
}
