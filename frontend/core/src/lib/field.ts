import { getContext, setContext } from 'svelte';

/** What a Field tells the control inside it: the ids that describe it and whether it holds an error. Input, Select and
 *  Textarea read it, so a field's error is announced with the field and the field is marked invalid (WCAG 3.3.1). */
export type FieldContext = { readonly describedBy: string | undefined; readonly invalid: boolean };

const KEY = Symbol('sc3-field');
export const provideField = (ctx: FieldContext) => setContext(KEY, ctx);
export const useField = () => getContext<FieldContext | undefined>(KEY);
