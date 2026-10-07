// The literal ratchet's allowances (core/tests/literals.test.ts): a match in UI code that is UI copy by coincidence,
// not a business datum. Each names the file (from frontend/), the exact text matched, and why it may stay.
export type Allowance = { file: string; match: string; reason: string };

const LAW_17 = 'Section 17(5)(h) and 17(5)(fa) of the CGST Act: the law a GST note cites, the same in every workspace';
const LAW_DATE = 'the day section 17(5)(fa) of the CGST Act took effect (1 October 2023): law, not workspace data';

export const ALLOW: Allowance[] = [
	{
		file: 'core/src/lib/workspace/screens/auth/SignIn.svelte',
		match: '10',
		reason: "an Indian mobile number has 10 digits: the sign-in's own check, not workspace data"
	},
	{ file: 'core/src/lib/workspace/screens/brand/Execution.svelte', match: '17', reason: LAW_17 },
	{ file: 'core/src/lib/workspace/screens/brand/Execution.svelte', match: '1 October', reason: LAW_DATE },
	{ file: 'core/src/lib/workspace/screens/finance/Paper.svelte', match: '17', reason: LAW_17 },
	{ file: 'core/src/lib/workspace/screens/finance/Paper.svelte', match: '1 October', reason: LAW_DATE },
	{ file: 'core/src/lib/workspace/screens/finance/Report.svelte', match: '17', reason: LAW_17 },
	{ file: 'core/src/lib/workspace/screens/finance/Report.svelte', match: '1 October', reason: LAW_DATE }
];
