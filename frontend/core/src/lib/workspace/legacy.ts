// Transitional (SC-67): the model's helpers bound to the stub, under the signatures they had before the screens read a
// source, while the screens move onto one folder at a time. Removed once no screen imports it.
import * as M from './model';
import { store } from './store.svelte';
import { data, kase } from './stub.svelte';
import type { RoleId, State } from './types';

export const heroModel = (s: State) => M.heroModel(s, data, kase);
export const batchViews = (s: State) => M.batchViews(s, data);
export const personById = (id: string) => M.personById(id, data, store.get());
export const permissionOf = (s: State, id: string) => M.permissionOf(s, id, data, kase);
export const distOf = (me: { org?: string } | null | undefined) => M.distOf(me, data, kase);
export const kOf = (me: { org?: string } | null | undefined) => M.kOf(me, kase);
export const cartons = (u: number) => M.cartons(u, kase.sku.perCarton);
export const offerMath = (n: number) => M.offerMath(n, kase);
export const ROLES = data.roles;
export const KINDS = M.kinds(data.workspace);
export const role = (r: RoleId) => M.role(r, data.roles);
