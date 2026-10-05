/** The app's width classes, read from the app's own width (not the window's), as the kit's bpOf():
 *  phone below 768, tablet below 1100, desktop from 1100. The same edges as base.css's .not-phone and .desk-only. */
export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export const PHONE_MAX = 767;
export const DESKTOP_MIN = 1100;

export const bpOf = (w: number): Breakpoint => (w < 768 ? 'phone' : w < DESKTOP_MIN ? 'tablet' : 'desktop');
