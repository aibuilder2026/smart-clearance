/** The exits in the order every chart and table lists them, so a channel keeps its place and its colour (--ch-<id>)
 *  everywhere (the kit's CH_ORDER) */
export const CH_ORDER = ['kirana', 'expiresoon', 'staff', 'd2c', 'foodbank', 'writeoff'] as const;
export const chColor = (id: string) => `var(--ch-${id})`;
