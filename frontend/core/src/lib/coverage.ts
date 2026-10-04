// Where each piece of design system v3 stands in core. Every export of the prototype's window.SC3 (design3/system
// kit.jsx, world.jsx, product.jsx) is listed exactly once, and a test keeps it that way: a new piece in design3 fails the
// test until it is either built here or planned.
export type Coverage = { status: 'built' } | { status: 'planned'; with: string };

const built: Coverage = { status: 'built' };
const later = (with_: string): Coverage => ({ status: 'planned', with: with_ });
const console_ = later('the console port');
const app = later('the workspace app port');
const step8 = later('SC-27, once the landing page is in');

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
	Chip: step8,
	Kbd: step8,
	GateChips: step8,
	Switch: step8,
	Stepper: step8,
	OTP: step8,
	Tabs: step8,
	Check: step8,
	SearchField: step8,
	DaysNum: step8,
	Splash: step8,
	PoweredBy: step8,
	WindowFrame: step8,
	Aura: step8,
	// later, with the screens that use them
	DataTable: console_,
	Skeleton: console_,
	Progress: console_,
	Empty: console_,
	Alert: console_,
	NoticeHost: console_,
	useNotice: console_,
	Shell: console_,
	Page: console_,
	Tile: console_,
	Countdown: app,
	Tracker: app,
	VTracker: app,
	TrackerCompact: app,
	TrackerCard: app,
	STAGE_TIMES: app,
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
	CodeBlock: console_,
	StatusBar: later('the guided demo port'),
	PhoneFrame: later('the guided demo port')
};
