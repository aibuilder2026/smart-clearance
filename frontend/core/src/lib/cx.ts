export type ClassValue = string | false | null | undefined | 0;

/** joins the truthy class names, as the kit's cx() does */
export const cx = (...names: ClassValue[]): string => names.filter(Boolean).join(' ');
