// Where each piece of design system v3 stands in core. Every export of the prototype's window.SC3 (design3/system
// kit.jsx, world.jsx, product.jsx) is listed exactly once, and a test keeps it that way: a new piece in design3 fails the
// test until it is either built here or planned.
export type Coverage = { status: 'built' } | { status: 'planned'; with: string } | { status: 'api'; as: string };

const built: Coverage = { status: 'built' };
const later = (with_: string): Coverage => ({ status: 'planned', with: with_ });
const app = later('the workspace app port');

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
	// later, with the screens that use them
	Skeleton: app,
	Tile: app,
	Countdown: app,
	TrackerCard: app,
	StatusBadge: app,
	BatchRow: app,
	AgentFeed: app,
	ClusterMap: app,
	HaulLine: app,
	ChannelBars: later('the workspace app port, on LayerChart'),
	TrendChart: later('the workspace app port, on LayerChart'),
	MixBar: later('the workspace app port, on LayerChart'),
	CH_ORDER: app,
	ChannelTable: app,
	SplitBar: app,
	MoneyPanel: app,
	DocCard: app,
	CodeBlock: app,
	StatusBar: later('the guided demo port'),
	PhoneFrame: later('the guided demo port')
};
