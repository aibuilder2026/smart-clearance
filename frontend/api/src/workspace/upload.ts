// Sending a file to a signed upload link (SC-73): the label photo and the DMS export go straight to Cloud Storage, and
// the app reports how far along they are. XMLHttpRequest, because fetch cannot report an upload's progress.
import { ApiError } from '../types/shared';
import type { UploadLink } from '../types/workspace';
import { OFFLINE } from './http';

export type UploadOptions = { onProgress?: (fraction: number) => void; signal?: AbortSignal };

export function putUpload(link: UploadLink, file: Blob, { onProgress, signal }: UploadOptions = {}): Promise<void> {
	if (typeof XMLHttpRequest === 'undefined') {
		return fetch(link.url, { method: 'PUT', headers: link.headers, body: file, signal }).then((r) => {
			if (!r.ok) throw new ApiError(r.status, 'The upload did not go through. Try again.');
			onProgress?.(1);
		});
	}
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('PUT', link.url);
		for (const [k, v] of Object.entries(link.headers)) xhr.setRequestHeader(k, v);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress?.(e.loaded / e.total);
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress?.(1);
				resolve();
			} else reject(new ApiError(xhr.status, 'The upload did not go through. Try again.'));
		};
		xhr.onerror = () => reject(new ApiError(0, OFFLINE));
		xhr.onabort = () => reject(new DOMException('The upload was stopped.', 'AbortError'));
		signal?.addEventListener('abort', () => xhr.abort(), { once: true });
		xhr.send(file);
	});
}
