// Journey times as the workspace's screens write them (SC-73). backend-api sends ISO times on the client's journey
// clock; the screens were designed on the prototype's strings ("09:00" today, "Thu 16:52" this week, "Fri 2 Oct",
// "Day 1"), so the live source writes each the same way, in India time, where Munchly's journey runs.
const TZ = 'Asia/Kolkata';

type Parts = { weekday: string; long: string; day: number; month: string; hour: number; minute: number; date: string };

const short = new Intl.DateTimeFormat('en-GB', {
	timeZone: TZ,
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});
const longDay = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long' });
const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

export function parts(iso: string): Parts {
	const d = new Date(iso);
	const p = Object.fromEntries(short.formatToParts(d).map((x) => [x.type, x.value]));
	return {
		weekday: p.weekday,
		long: longDay.format(d),
		day: Number(p.day),
		month: p.month,
		hour: Number(p.hour),
		minute: Number(p.minute),
		date: isoDay.format(d)
	};
}

const pad = (n: number) => String(n).padStart(2, '0');
const days = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

/** 09:00 */
export const hhmm = (iso: string) => {
	const p = parts(iso);
	return `${pad(p.hour)}:${pad(p.minute)}`;
};
/** the India date: 2026-10-02 */
export const dateOf = (iso: string) => parts(iso).date;
/** Fri 2 Oct */
export const dayLabel = (iso: string) => {
	const p = parts(iso);
	return `${p.weekday} ${p.day} ${p.month}`;
};
/** 1 Oct */
export const dayMonth = (iso: string) => {
	const p = parts(iso);
	return `${p.day} ${p.month}`;
};
/** Tuesday */
export const weekday = (iso: string) => parts(iso).long;
/** Thu 16:52 */
export const dayTime = (iso: string) => `${parts(iso).weekday} ${hhmm(iso)}`;
/** 10 am, 4 pm, 10:30 am */
export const hourWord = (iso: string) => {
	const { hour, minute } = parts(iso);
	const h = hour % 12 || 12;
	return `${h}${minute ? ':' + pad(minute) : ''} ${hour < 12 ? 'am' : 'pm'}`;
};
/** Day 0, Day 1 … counted from a day 0 */
export const dayN = (iso: string, day0: string) => `Day ${Math.max(0, days(dateOf(iso), dateOf(day0)))}`;

/** a time as the screens date it, from where the journey stands (today): the time today, the day and time this week,
 *  else the date */
export function when(iso: string | null | undefined, today: string): string {
	if (!iso) return '';
	const d = days(dateOf(iso), dateOf(today));
	if (d === 0) return hhmm(iso);
	if (Math.abs(d) <= 6) return dayTime(iso);
	const p = parts(iso);
	return `${p.day} ${p.month}`;
}

/** minutes between two times */
export const minutes = (a: string, b: string) => Math.max(0, Math.round((Date.parse(a) - Date.parse(b)) / 60_000));
