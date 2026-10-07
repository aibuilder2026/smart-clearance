// Where each piece of design system v3 stands in core. Every export of the prototype's window.SC3 (design3/system
// kit.jsx, world.jsx, product.jsx) is listed exactly once, and a test keeps it that way: a new piece in design3 fails the
// test until it is either built here or planned. Since the guided demo's port (SC-63) every piece is built, bar the
// stages' times, which are data.
export type Coverage = { status: 'built' } | { status: 'planned'; with: string } | { status: 'api'; as: string };

const built: Coverage = { status: 'built' };

export const COVERAGE: Record<string, Coverage> = {
	// foundations
	cx: built,
	ThemeProvider: built,
	useTheme: built,
	AppRoot: built,
	useApp: built,
	Portal: built, // bits-ui's Portal, into AppState.overlays
	Icon: built,
	// controls and containers the landing page uses
	Spinner: built,
	Button: built,
	IconButton: built,
	Badge: built,
	Card: built,
	List: built,
	ListRow: built,
	Segmented: built,
	Field: built,
	Input: built,
	Select: built,
	Textarea: built,
	Sheet: built,
	Menu: built,
	ModeMenuButton: built,
	Money: built,
	Roll: built,
	Avatar: built,
	Product: built,
	Mark: built,
	Wordmark: built,
	WorkspaceMark: built,
	// the rest of their design-system sections
	Chip: built,
	Kbd: built,
	GateChips: built,
	Switch: built,
	Stepper: built,
	OTP: built,
	Tabs: built,
	Check: built,
	SearchField: built,
	DaysNum: built,
	Splash: built,
	PoweredBy: built,
	WindowFrame: built,
	Aura: built,
	// the console's (SC-37)
	DataTable: built,
	Progress: built,
	Empty: built,
	Alert: built,
	NoticeHost: built,
	useNotice: built,
	Shell: built,
	Page: built,
	Tracker: built,
	VTracker: built,
	TrackerCompact: built,
	// data, not a component: each stage's time comes with the console's config
	STAGE_TIMES: { status: 'api', as: 'GET /v1/console/config, stages[].time' },
	// the workspace app's (SC-62); the charts are the prototype's own hand-built SVG, as drawn there
	Skeleton: built,
	Tile: built,
	Countdown: built,
	TrackerCard: built,
	StatusBadge: built,
	BatchRow: built,
	AgentFeed: built,
	ClusterMap: built,
	HaulLine: built,
	ChannelBars: built,
	TrendChart: built,
	MixBar: built,
	CH_ORDER: built,
	ChannelTable: built,
	SplitBar: built,
	MoneyPanel: built,
	DocCard: built,
	CodeBlock: built,
	// the guided demo's (SC-63)
	StatusBar: built,
	PhoneFrame: built
};
