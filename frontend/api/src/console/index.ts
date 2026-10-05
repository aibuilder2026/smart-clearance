// @smart-clearance/api/console: what the staff console calls, over HTTP or from the in-browser mock, and the platform's
// rules it previews choices with
export { consoleHttp } from './http';
export { consoleMock, CONSOLE_KEY, SESSION_KEY } from './mock';
export * from './platform';
export type * from '../types/console';
export { ApiError } from '../types/shared';
export type * from '../types/shared';
