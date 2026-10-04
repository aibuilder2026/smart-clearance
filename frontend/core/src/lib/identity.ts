// How a person is recognised when they type who they are: an email address, or an Indian mobile number with or
// without +91 and spaces (the prototype's sign-in rules, screens/auth.jsx).
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

/** the ten digits of a mobile number: "+91 98230 44118" → "9823044118" */
export const digits = (v: string) => {
	const d = (v || '').replace(/\D/g, '');
	return d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
};

export const phoneOf = (d: string) => '+91 ' + d.replace(/(\d{5})(\d{5})/, '$1 $2');
