// What a live build has in place of the prototype's stub (vite.config.ts): nothing. #lib/client.ts never imports it when
// PUBLIC_API_BASE is set; this stands in so the stub's seed cannot be bundled at all.
export const stubSource: never = undefined as never;
throw new Error('The prototype’s stub is not part of a live build.');
