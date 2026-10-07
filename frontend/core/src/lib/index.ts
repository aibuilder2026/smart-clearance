// @smart-clearance/core: design system v3 in Svelte 5. Names, props, DOM and class names follow the prototype's kit
// (design3/system), so its components.css applies unchanged; README.md maps the React props to Svelte's.
export { cx, type ClassValue } from './cx';
export { fmt, rate } from './format';
export { bpOf, PHONE_MAX, DESKTOP_MIN, type Breakpoint } from './bp';
export {
	Theme,
	useTheme,
	provideTheme,
	THEME_KEY,
	type ThemeMode,
	type ResolvedTheme,
	type ThemeGate
} from './theme.svelte';
export { AppState, useApp, provideApp } from './app.svelte';
export { imgUrl, ICON_SVG } from './assets';
export { isEmail, digits, phoneOf } from './identity';
export { SPRINGS, DURATION, EASE, ease, springCurve, cubicBezier, motionMs, prefersReducedMotion } from './motion';
export { rise, fade } from './motion/transitions';
export { CH_ORDER, chColor } from './channels';
export { ICONS, type IconName, type IconNode } from './icons/registry';
export { COVERAGE, type Coverage } from './coverage';
export { Notices, useNotice, provideNotice, type Toast, type Banner } from './notice.svelte';

export { default as Icon } from './icons/Icon.svelte';
export { default as ThemeProvider } from './components/ThemeProvider.svelte';
export { default as AppRoot } from './components/AppRoot.svelte';
export { default as Spinner } from './components/Spinner.svelte';
export { default as Button } from './components/Button.svelte';
export { default as IconButton } from './components/IconButton.svelte';
export { default as Badge } from './components/Badge.svelte';
export { default as Card } from './components/Card.svelte';
export { default as List } from './components/List.svelte';
export { default as ListRow } from './components/ListRow.svelte';
export { default as Field } from './components/Field.svelte';
export { default as Input } from './components/Input.svelte';
export { default as Select } from './components/Select.svelte';
export { default as Textarea } from './components/Textarea.svelte';
export { default as Segmented } from './components/Segmented.svelte';
export { default as Sheet } from './components/Sheet.svelte';
export { default as Menu, type MenuItem } from './components/Menu.svelte';
export { default as ModeMenuButton } from './components/ModeMenuButton.svelte';
export { default as Roll } from './components/Roll.svelte';
export { default as Money } from './components/Money.svelte';
export { default as Avatar, type Person } from './components/Avatar.svelte';
export { default as Product } from './components/Product.svelte';
export { default as Mark } from './components/Mark.svelte';
export { default as Wordmark } from './components/Wordmark.svelte';
export { default as WorkspaceMark, type Workspace } from './components/WorkspaceMark.svelte';
export { default as Chip } from './components/Chip.svelte';
export { default as Kbd } from './components/Kbd.svelte';
export { default as GateChips, type Gate } from './components/GateChips.svelte';
export { default as Switch } from './components/Switch.svelte';
export { default as Stepper } from './components/Stepper.svelte';
export { default as OTP } from './components/OTP.svelte';
export { default as Tabs } from './components/Tabs.svelte';
export { default as Check } from './components/Check.svelte';
export { default as SearchField } from './components/SearchField.svelte';
export { default as DaysNum } from './components/DaysNum.svelte';
export { default as Aura } from './components/Aura.svelte';
export { default as PoweredBy } from './components/PoweredBy.svelte';
export { default as WindowFrame } from './components/WindowFrame.svelte';
export { default as Splash } from './components/Splash.svelte';
export { default as Shell, type NavItem } from './components/Shell.svelte';
export { default as Page } from './components/Page.svelte';
export { default as DataTable, type Column, type Sort } from './components/DataTable.svelte';
export { default as Empty } from './components/Empty.svelte';
export { default as Progress } from './components/Progress.svelte';
export { default as Alert, type AlertAction } from './components/Alert.svelte';
export { default as NoticeHost } from './components/NoticeHost.svelte';
export { default as Tracker, type TrackerStage } from './components/Tracker.svelte';
export { default as VTracker, type VTrackerItem } from './components/VTracker.svelte';
export { default as TrackerCompact } from './components/TrackerCompact.svelte';
export { default as FindWorkspace, type WorkspaceMatch } from './patterns/FindWorkspace.svelte';
export { default as Columns } from './patterns/Columns.svelte';
export { default as SectionTitle } from './patterns/SectionTitle.svelte';
// the workspace app's (SC-62): feedback, the live-tracking world's maps, charts and feed, and the product patterns
export { default as Skeleton } from './components/Skeleton.svelte';
export { default as Tile } from './components/Tile.svelte';
export { default as Countdown } from './components/Countdown.svelte';
export { default as StatusBadge, STATUS } from './components/StatusBadge.svelte';
export { default as TrackerCard } from './components/TrackerCard.svelte';
export { default as BatchRow } from './components/BatchRow.svelte';
export { default as AgentFeed } from './components/AgentFeed.svelte';
export { default as ClusterMap } from './components/ClusterMap.svelte';
export { default as HaulLine } from './components/HaulLine.svelte';
export { default as ChannelBars } from './components/ChannelBars.svelte';
export { default as TrendChart } from './components/TrendChart.svelte';
export { default as MixBar } from './components/MixBar.svelte';
export { default as ChannelTable } from './components/ChannelTable.svelte';
export { default as SplitBar } from './components/SplitBar.svelte';
export { default as MoneyPanel } from './components/MoneyPanel.svelte';
export { default as DocCard } from './components/DocCard.svelte';
export { default as CodeBlock } from './components/CodeBlock.svelte';
