// @smart-clearance/api: the frontend's side of backend-api. The contract's shared types, ApiError and the HTTP
// transport; each surface's client and in-browser mock is its own entry, so an app bundles only its own:
//   @smart-clearance/api/site     the landing page (admin)
//   @smart-clearance/api/console  the staff console
//   @smart-clearance/api/workspace  a client's workspace (SC-66)
export { ApiError } from './types/shared';
export type * from './types/shared';
export { transport, type Call, type Method, type TransportOptions } from './http';
export type { MockOptions } from './mock/shared';
