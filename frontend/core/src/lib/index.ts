// @smart-clearance/core: design system v3 in Svelte 5. Names, props, DOM and class names follow the prototype's kit
// (design3/system), so its components.css applies unchanged; README.md maps the React props to Svelte's.
export { cx, type ClassValue } from './cx';
export { fmt, rate } from './format';
export { bpOf, PHONE_MAX, DESKTOP_MIN, type Breakpoint } from './bp';
export { Theme, useTheme, provideTheme, THEME_KEY, type ThemeMode, type ResolvedTheme } from './theme.svelte';
export { AppState, useApp, provideApp } from './app.svelte';
export { imgUrl, ICON_SVG } from './assets';
export { isEmail, digits, phoneOf } from './identity';
export { SPRINGS, DURATION, EASE, ease, springCurve, cubicBezier, motionMs, prefersReducedMotion } from './motion';
export { ICONS, type IconName, type IconNode } from './icons/registry';
export { COVERAGE, type Coverage } from './coverage';

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
export { default as FindWorkspace, type WorkspaceMatch } from './patterns/FindWorkspace.svelte';
