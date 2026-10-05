import type { Integration } from '@smart-clearance/api/console';

/** how a connection reads: its badge's tone and label */
export const STATUS: Record<Integration['status'], [tone: 'green' | 'amber' | undefined, label: string]> = {
	ok: ['green', 'Connected'],
	mock: [undefined, 'Mocked'],
	soon: [undefined, 'Soon'],
	waiting: ['amber', 'Waiting for the first file']
};
