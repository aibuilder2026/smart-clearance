// Who is on the demo's devices (director.jsx): each person's device and place, the console's staff member, a shop the
// story's store has no account for, and who signs in with what. Every person is fictional.
import { D, store, type User } from '@smart-clearance/core/workspace';
import type { Beat, DeviceSpec, Station } from './types.ts';

export const LABEL: Record<string, string> = {
	priya: "Priya's",
	rakesh: "Rakesh bhai's",
	ganesh: "Ganesh ji's",
	agrawal: "Agrawal ji's",
	meera: "Meera's",
	'lakshmi-owner': "Lakshmi Agencies'",
	neha: "Neha's",
	'kirana-shubham-provision': "Shubham Provision's",
	'kirana-sri-lakshmi-ganapathi-kirana': "Sri Lakshmi Ganapathi Kirana's"
};
export const PLACE: Record<string, string> = {
	priya: 'Munchly Foods, Pune',
	rakesh: 'Kalamna godown, Nagpur',
	ganesh: 'Shree Ganesh Kirana, Itwari',
	agrawal: 'Agrawal Wholesale, Raipur',
	meera: 'Feeding India, Hyderabad',
	'lakshmi-owner': 'Begum Bazaar godown, Hyderabad',
	neha: 'Smart-Clearance, Bengaluru',
	'kirana-shubham-provision': 'Dharampeth, Nagpur',
	'kirana-sri-lakshmi-ganapathi-kirana': 'Begum Bazaar, Hyderabad'
};
/** the console's staff member, who is no one in the workspace */
const NEHA = {
	id: 'neha',
	name: 'Neha Kulkarni',
	short: 'Neha',
	org: 'Smart-Clearance',
	role: 'Super admin'
} as unknown as User;
/** who signs in with what, in the chips' first stage */
export const PREFILL: Record<string, string> = {
	priya: D.people.priya.email!,
	rakesh: D.people.rakesh.phone!.replace('+91 ', '')
};
/** someone in the store (with their role and sign-in), else in the story */
export const user = (id: string): User =>
	id === 'neha'
		? NEHA
		: ((store.state.users.find((u) => u.id === id) || D.people[id] || { id, name: id, short: id }) as User);

/** a beat's two devices, merged over its station's (a phone of null: the laptop alone) */
export const specsOf = (st: Station, b: Beat): { desk: DeviceSpec; phone: DeviceSpec | null } => ({
	desk: { ...st.desk, ...b.desk },
	phone: b.phone === null ? null : st.phone == null && !b.phone ? null : { ...st.phone, ...b.phone }
});
/** a beat the visitor ticks in a device: a push on a lock screen, or a sign-in */
export const tapOf = (st: Station, b: Beat) => {
	const sp = specsOf(st, b);
	const f = b.focus === 'desk' ? sp.desk : sp.phone || sp.desk;
	return !!(f.lock?.push || f.signin);
};
