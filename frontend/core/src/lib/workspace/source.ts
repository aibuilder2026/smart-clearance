// Where the workspace app's screens read their data from (SC-67). A source holds one workspace: what its sign-in
// shows, who is signed in, the journey's state, the workspace's own data and the batch in focus; and it takes every
// step a person makes. The screens read only this, so the stub (stub.svelte.ts, the prototype's journey in the
// browser) and a live source over backend-api (SC-73) are interchangeable. The host provides one with
// provideWorkspace; a screen drawn outside any provider (the guided demo, the design-system page) reads the default.
import { createContext } from 'svelte';
import type {
	ActionArg,
	CaseData,
	CaseTab,
	JourneyClock,
	Ledger,
	PartnerView,
	LedgerPage,
	BatchRecord,
	ExploreGroup,
	HumanAction,
	InviteInput,
	RoleId,
	Rules,
	SourceStatus,
	StaffReceipt,
	State,
	User,
	UserStatus,
	WorkspaceData,
	WorkspacePublic
} from './types';

/** a step that did not go through: what happened, in the API's words, and the same step again */
export type Failure = { action: HumanAction; message: string; stale: boolean; retry(): Promise<void> };

/** how a step answers a refusal (SC-152). Without `inline`, a step never rejects: the live source keeps the refusal as
 *  `failed`, which the screen's band (LiveBand) says with Retry. With `inline`, the button that sent it says why: the
 *  step rejects with an Error in the API's own words and leaves `failed` alone, so nothing says it twice. Either way a
 *  change shown at once is put back, a stale step reads the workspace again, a signed-out refusal signs out, and a
 *  file the person stopped on its way is not a refusal (it resolves). The stub never refuses. */
export type SendOptions = { inline?: boolean };

export interface WorkspaceSource {
	readonly kind: 'stub' | 'live';
	readonly status: SourceStatus;
	/** the workspace as its sign-in page shows it, before anyone signs in */
	readonly publicInfo: WorkspacePublic | null;
	/** the person signed in, or null */
	readonly me: User | null;
	/** the journey's state */
	readonly state: State;
	/** the workspace's own data */
	readonly data: WorkspaceData;
	/** the batch in focus; null when no batch is at risk (the stub always has one) */
	readonly case: CaseData | null;
	/** the batch a screen asked for, by its ref; null for the one the workspace puts first */
	readonly focus: string | null;
	/** the steps sent and not yet done */
	readonly pending: ReadonlySet<string>;
	/** the ledger (SC-121, SC-124): every batch cleared, by quarter and by year, and the batches still out;
	 *  null until it has been read, and for a role that does not read it */
	readonly ledger: Ledger | null;
	/** the partner's own history (SC-130): the batches a distributor, a kirana or a food bank took part in, each cut to
	 *  its part; null until read, and for a role that is not a partner */
	readonly partners: PartnerView | null;
	/** a batch's own page in the ledger, once it has been read (openPage asks the live source to read it) */
	ledgerPage(ref: string): LedgerPage | null;
	/** the live source only: read a batch's page for the ledger, and keep it up to date while it is open */
	openPage?(ref: string): void;
	/** a batch's record (SC-142): the photos sent for it and every step, by the agent or the person who took it; null
	 *  until read (openRecord asks the live source to read it), and for a role that does not read it */
	record(ref: string): BatchRecord | null;
	/** the live source only: read a batch's record, and again when its batch changes */
	openRecord?(ref: string): void;
	/** the live source only: files on their way to the workspace (the label photo, a stock export), 0 to 1 */
	readonly uploads?: ReadonlyMap<string, number>;
	/** the live source only: the last step that did not go through, with what to tell the person and how to try again */
	readonly failed?: Failure | null;
	dismissFailure?(): void;
	/** the live source only (SC-73): the journey clock, once the workspace has been read */
	readonly clock?: JourneyClock | null;
	/** the live source only: the batches in a journey that can be in focus, most urgent first (the tabs over the
	 *  tracker card and under the Route Room's title) */
	readonly cases?: readonly CaseTab[];
	/** the live source only: an account that signed in but is not a member here, in the backend's words */
	readonly outsider?: string | null;
	/** the live source only: try the live stream again now */
	reconnect?(): void;
	/** the live source only: a DMS export for the Data agent, its progress in uploads ('export') */
	uploadExport?(file: Blob, o?: SendOptions): Promise<void>;
	/** the live source only: stop a file on its way (its key in uploads) */
	cancelUpload?(key: string): void;
	/** the live source only: the staff sale's consolidated receipt, a photo or a PDF, to its signed link (its progress in
	 *  uploads under 'receipt:<ref>'), then Vision reads its payments into the journey's staff sale (SC-174). Of the
	 *  batch in focus, or the one named */
	staffReceipt?(file: Blob, o?: { ref?: string } & SendOptions): Promise<void>;
	/** the stub only: what Vision reads from a batch's consolidated receipt, the batch's own (SC-174), as the prototype
	 *  stands in for Gemini vision; null for a batch with none */
	staffReceiptOf?(ref: string): StaffReceipt | null;
	/** the stub only: the people a visitor can step into */
	readonly explore?: ExploreGroup[];
	/** the stub only: whether this browser session has yet to see the splash, and the end of it */
	readonly splash?: boolean;
	splashed?(): void;

	/** start keeping the workspace up to date (the app calls it once); returns how to stop */
	start(): () => void;
	setFocus(ref: string | null): void;
	signIn(i: { email: string; password: string } | { uid: string }): Promise<User>;
	signOut(): Promise<void>;
	/** a step a person takes; feel waits that long first, so a tap is felt before the journey moves (it is pending
	 *  meanwhile). It acts on the batch in focus, or on the batch `ref` names (the live workspace; the stub has its
	 *  story's batches only). With `inline`, a refusal rejects for the button that sent it to say (SendOptions) */
	act<N extends HumanAction>(
		name: N,
		arg?: ActionArg<N>,
		o?: { feel?: number; ref?: string } & SendOptions
	): Promise<void>;
	/** the live source only: the buyer's message to the seller, which the Negotiator answers */
	message?(text: string, o?: SendOptions): Promise<void>;
	/** the live source only: a link to a document's PDF, for a few minutes; of the batch in focus, or the one named. A
	 *  read, not a step: it always rejects when the link cannot be had, so its caller says why */
	documentUrl?(doc: string, ref?: string): Promise<string>;
	/** optimistic: shown read at once, put back if refused; it never rejects */
	markRead(ids: string[] | 'all'): Promise<void>;
	invite(i: InviteInput, o?: SendOptions): Promise<void>;
	setUserStatus(id: string, s: UserStatus, o?: SendOptions): Promise<void>;
	setUserRole(id: string, r: RoleId, o?: SendOptions): Promise<void>;
	saveRules(r: Rules, o?: SendOptions): Promise<void>;
	/** the stub only: the journey back to its start */
	reset?(): void;
}

const [get, set, has] = createContext<WorkspaceSource>();
let fallback: WorkspaceSource | null = null;

/** the source a screen reads when no host has provided one (the stub sets itself) */
export const setDefaultSource = (s: WorkspaceSource) => void (fallback = s);
/** the host's source for every screen under it */
export const provideWorkspace = (s: WorkspaceSource) => set(s);
/** the source of the workspace this screen is in */
export function useWorkspace(): WorkspaceSource {
	if (has()) return get();
	if (fallback) return fallback;
	throw new Error('useWorkspace: no workspace source; provide one with provideWorkspace, or import the stub');
}
