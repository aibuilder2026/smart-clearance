// The literal ratchet's allowances (core/tests/literals.test.ts): a match in UI code that is UI copy by coincidence,
// not a business datum. Each names the file (from frontend/), the exact text matched, and why it may stay.
export type Allowance = { file: string; match: string; reason: string };

export const ALLOW: Allowance[] = [];
