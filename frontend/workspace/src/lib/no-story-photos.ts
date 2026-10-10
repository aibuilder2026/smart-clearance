// What a live build has in place of core's story-photos.ts (vite.config.ts): no photos. Every photo a live workspace
// shows comes from backend-api's short-lived links, so the story's evidence and label photos stay out of the build.
export const storyPhotos: Record<string, string> = {};
