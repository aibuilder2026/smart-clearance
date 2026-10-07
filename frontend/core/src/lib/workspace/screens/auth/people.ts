// the people someone exploring the prototype can step into, by where they stand: inside Munchly, invited in, or
// outside the workspace (screens/auth.jsx DEMO_PEOPLE)
export const DEMO_PEOPLE: { group: string; note: string; ids: [string, string][] }[] = [
	{
		group: 'Munchly Foods',
		note: 'staff · Google Workspace',
		ids: [
			['priya', 'Approve the plan for the chips batch'],
			['anita', "Review Munchly's credit note and GST memo"],
			['vikram', 'Export the BRSR table'],
			['arjun', 'The workspace, its people and the guardrails']
		]
	},
	{
		group: 'Invited partners',
		note: 'a one-time code or Google',
		ids: [
			['rakesh', 'Give the permission, send the photo, run the van'],
			['ganesh', 'Order from the Hindi offer'],
			['meera', 'Confirm a food-bank pickup']
		]
	},
	{
		group: 'Outside the workspace',
		note: "ExpireSoon, another company's marketplace",
		ids: [['agrawal', 'Bid on the lot from Raipur']]
	}
];

/** the one-time code every invited number gets in this prototype */
export const TEST_CODE = '246810';
