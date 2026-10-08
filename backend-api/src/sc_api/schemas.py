"""The API's shapes, field for field the frontend's contract (frontend/api/src/types/{shared,site,console}.ts).

- JSON is camelCase; Python is snake_case.
- A field the contract marks optional (`x?: T`) defaults to MISSING and is left out of the JSON when unset.
- A nullable one (`x: T | null`) is always there.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from pydantic.experimental.missing_sentinel import MISSING

ExitId = Literal["expiresoon", "kirana", "staff", "foodbank", "d2c"]
Autonomy = Literal["suggest", "ask", "act"]
Access = Literal["Approver", "Admin", "Member", "Partner"]
StaffRole = Literal["Super admin", "Platform engineer", "Support"]
PresetId = Literal["cautious", "standard", "trusted"]
SettingValue = bool | int | float | str | None


class Shape(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, serialize_by_alias=True, extra="forbid", strict=False
    )


# --- shared ------------------------------------------------------------------------------------------------------


class Mark(Shape):
    from_: str = Field(alias="from")
    to: str
    ink: str


class WorkspaceSummary(Shape):
    id: str
    name: str
    short: str
    domain: str
    email_domain: str
    mark: Mark


class AgentDef(Shape):
    id: str
    name: str
    stage: str
    icon: str
    model: str | MISSING = MISSING
    job: str
    gate: bool


class ConnectorDef(Shape):
    id: str
    name: str
    kind: str
    icon: str
    note: str
    status: Literal["ok", "mock", "soon"]


class PlanTier(Shape):
    id: str
    name: str
    scope: list[str]


class Catalog(Shape):
    agents: list[AgentDef]
    connectors: list[ConnectorDef]
    plans: list[PlanTier]


class LookupInput(Shape):
    query: str = Field(max_length=200)


class WorkspaceMatch(Shape):
    """a workspace an email address or mobile number belongs to. It names the workspace only: never the person's role
    or whether they were deactivated (SC-43)"""

    workspace: WorkspaceSummary
    value: str


class DemoRequestInput(Shape):
    name: str = Field(max_length=120)
    company: str = Field(max_length=160)
    email: str = Field(max_length=200)
    makes: str = Field(max_length=80)
    plan: str | None = Field(default=None, max_length=40)
    note: str = Field(default="", max_length=2000)


class DemoRequest(Shape):
    id: str
    at: str
    name: str
    company: str
    email: str
    makes: str
    plan: str | None
    note: str
    status: Literal["new", "set up"]
    client: str | MISSING = MISSING


# --- the console -------------------------------------------------------------------------------------------------


class ExitState(Shape):
    on: bool
    locked: str | MISSING | None = MISSING
    cap: int | MISSING = MISSING


class Profile(Shape):
    route: Literal["distributors", "modern-trade", "own"]
    owner: Literal["distributor", "manufacturer"]
    expiry: Literal["full-credit", "price-support", "none"]


class Gates(Shape):
    blinkit_days: int
    qcom_pct: int


class Rules(Shape):
    reserve: float
    scheme: str
    staff_cap: int
    token_pct: int
    offer_window_hours: int
    hindi_offers: bool
    require_photo: bool


class AgentConfig(Shape):
    on: bool
    autonomy: Literal["suggest", "ask", "act", "gate"]
    settings: dict[str, SettingValue]
    last: str | None
    next: str | None


class ClientPerson(Shape):
    id: str
    name: str
    org: str
    role: str
    kind: str
    access: Access
    provider: str
    status: Literal["active", "invited", "deactivated"]
    img: str | None
    email: str
    phone: str


class DistributorOut(Shape):
    id: str
    name: str
    city: str
    state: str | MISSING = MISSING
    kiranas: int
    staff_cap: int | None
    permission: Literal["given", "not-yet"]


class SkuGates(Shape):
    """an SKU's own quick-commerce gates (SC-47): each value the SKU's, or absent for the client's default"""

    blinkit_days: int | MISSING = MISSING
    qcom_pct: int | MISSING = MISSING


class SkuOut(Shape):
    id: str
    code: str
    brand: str
    name: str
    mrp: float
    gst: float
    life_days: int
    gates: SkuGates


GateApp = Literal["blinkit", "zepto", "instamart"]
GateSource = Literal["default", "sku", "override"]


class GateCheck(Shape):
    """a gate as the agents read it: what the app needs and what the batch has (days for Blinkit, % of life for the
    others)"""

    app: GateApp
    need: int
    has: int
    pass_: bool = Field(alias="pass")
    source: GateSource


class BatchOverride(Shape):
    blinkit_days: int | MISSING = MISSING
    qcom_pct: int | MISSING = MISSING
    reason: str
    by: str
    at: str


class BatchGates(Shape):
    """an open batch, and its quick-commerce gates as the agents read them"""

    ref: str
    sku: str
    distributor: str
    units: int
    best_before: str
    days_left: int
    life_days: int
    blinkit_days: int
    qcom_pct: int
    checks: list[GateCheck]
    override: BatchOverride | MISSING = MISSING


class Integration(Shape):
    id: str
    name: str
    kind: str
    status: Literal["ok", "mock", "soon", "waiting"]
    note: str


class SignInMethod(Shape):
    id: str
    title: str
    who: str
    rule: str
    on: bool


class ExportColumnOut(Shape):
    """a Smart-Clearance field a stock export fills, and the file's column for it once the Data agent has mapped it"""

    field: str
    column: str | None


class FirstExportOut(Shape):
    """a client's stock export as staff set it up (SC-84): mapping until the Data agent has read it, then mapped"""

    status: Literal["mapping", "mapped"]
    file: str
    rows: int
    batches: int
    distributors: int
    by: str | None
    at: str | None
    columns: list[ExportColumnOut]


class ExportUploadInput(Shape):
    content_type: str = Field(max_length=100)
    bytes: int = Field(gt=0)
    file_name: str | None = Field(default=None, max_length=200)


class ExportArrivedInput(Shape):
    file_name: str | None = Field(default=None, max_length=200)


class UploadLinkOut(Shape):
    id: str
    url: str
    headers: dict[str, str]
    expires_at: str


class ClientOut(Shape):
    id: str
    name: str
    legal: str
    city: str
    industry: str
    domain: str
    email_domain: str
    mark: Mark
    plan: str
    status: Literal["live", "setting-up"]
    since: str | None
    region: str
    profile: Profile
    gates: Gates
    territory_guard: bool
    return_window_days: int
    day_minutes: int
    exits: dict[ExitId, ExitState]
    rules: Rules
    sign_in: list[SignInMethod]
    distributors: list[DistributorOut]
    skus: list[SkuOut]
    people: list[ClientPerson]
    integrations: list[Integration]
    recovered: float
    batches: int
    approver: str | None
    agents: dict[str, AgentConfig]
    first_export: FirstExportOut | None


class Staff(Shape):
    id: str
    name: str
    short: str
    role: StaffRole
    team: str
    email: str
    passkey: str
    status: Literal["active", "invited"]


class Track(Shape):
    client: str
    batch: str
    product: str
    distributor: str
    city: str
    done: int
    current: int
    note: str | MISSING = MISSING
    money: float | MISSING = MISSING
    split: str | MISSING = MISSING


class Run(Shape):
    at: str
    agent: str
    client: str
    text: str


class AuditEntry(Shape):
    id: str
    at: str
    who: str
    client: str | None
    text: str


class AttentionAction(Shape):
    kind: Literal["remind", "open"]
    label: str
    distributor: str | MISSING = MISSING
    tab: str | MISSING = MISSING


class Attention(Shape):
    id: str
    client: str
    icon: str
    tone: Literal["amber", "blue"]
    title: str
    text: str
    action: AttentionAction


class DayFigures(Shape):
    """one day of the dashboard's range"""

    date: str
    label: str
    recovered: float
    closed: int
    units: int
    runs: int


class Waiting(Shape):
    """the batch waiting longest for a person's yes"""

    hours: int
    client: str


class BatchMark(Shape):
    """a batch as Agents at work draws it: its client's mark, keyed by the batch, and when it reached its stop (or
    closed) in India's time, so a reading can tell what arrived since the last (SC-49)"""

    client: str
    ref: str
    at: str


class ClosedToday(Shape):
    """the batches closed today (India's day): how many, what they recovered, and the latest three"""

    count: int
    recovered: float
    batches: list[BatchMark]


class Dashboard(Shape):
    """the platform's figures over a range of days (SC-48): every one an aggregate over the database when read"""

    read_at: str
    days: int
    recovered: float
    recovered_before: float
    by_day: list[DayFigures]
    in_flight: int
    in_flight_clients: int
    in_flight_series: list[int]
    waiting: int
    oldest_waiting: Waiting | MISSING = MISSING
    runs_today: int
    by_stop: list[int]
    # the latest three batches to arrive at each of the nine stops, and today's closed batches (SC-49)
    at_stop: list[list[BatchMark]]
    closed_today: ClosedToday


BatchStatus = Literal["in-flight", "waiting", "closed"]
BatchSort = Literal["priority", "stop", "days", "units", "value", "updated"]


class BatchQuery(Shape):
    status: BatchStatus = "in-flight"
    client: str | None = None
    stop: int | None = Field(default=None, ge=0, le=8)
    q: str | None = Field(default=None, max_length=80)
    sort: BatchSort = "priority"
    dir: Literal["asc", "desc"] = "asc"
    page: int = Field(default=1, ge=1, le=10_000)
    size: int = 8


class BatchRow(Shape):
    """a batch in the Overview's table: what it is, where it stands, and its value (at MRP while in flight, what it
    recovered once past Settle)"""

    client: str
    ref: str
    product: str
    distributor: str
    city: str
    stage: int
    done: int
    days_left: int | MISSING = MISSING
    units: int
    value: float
    value_kind: Literal["mrp", "recovered"]
    updated: str
    closed: bool
    outcome: str | MISSING = MISSING


class BatchCounts(Shape):
    in_flight: int
    waiting: int
    closed: int


class BatchPage(Shape):
    rows: list[BatchRow]
    total: int
    page: int
    size: int
    counts: BatchCounts


class Overview(Shape):
    tracks: list[Track]
    runs: list[Run]
    attention: list[Attention]


class ConsoleConfig(Shape):
    """the console's config document as design3 describes it, and the staff domain this environment uses"""

    model_config = ConfigDict(extra="allow")
    staff_email_domain: str


# --- what the console sends --------------------------------------------------------------------------------------


class AgentPatch(Shape):
    on: bool | None = None
    autonomy: Autonomy | None = None
    settings: dict[str, SettingValue] | None = None


class ProfileInput(Shape):
    profile: Profile
    gates: Gates
    return_window_days: int


class SkuGatesInput(Shape):
    """an SKU's own gates, or null to put it back on the client's default"""

    gates: SkuGates | None


class OverrideInput(Shape):
    blinkit_days: int | None = None
    qcom_pct: int | None = None
    reason: str = Field(max_length=2000)


class RulesInput(Shape):
    rules: Rules
    exits: dict[ExitId, ExitState]


class InviteInput(Shape):
    name: str = Field(max_length=120)
    contact: str = Field(max_length=200)
    access: Access


class PersonPatch(Shape):
    access: Access | None = None
    status: Literal["active", "deactivated"] | None = None


class StaffInviteInput(Shape):
    name: str = Field(max_length=120)
    email: str = Field(max_length=200)
    role: StaffRole


class PlanPatch(Shape):
    plan: str


class NewClientInput(Shape):
    name: str = Field(max_length=120)
    city: str = Field(max_length=80)
    industry: str = Field(max_length=80)
    colour: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    slug: str = Field(max_length=40)
    email_domain: str = Field(max_length=120)
    sign_google: bool
    sign_phone: bool
    profile: Profile
    exits: dict[ExitId, ExitState]
    preset: PresetId
    admin_name: str = Field(max_length=120)
    admin_email: str = Field(max_length=200)
    plan: str
    request: str | None = None


def dump(model: BaseModel) -> dict[str, Any]:
    return model.model_dump(mode="json", by_alias=True)


# --- the console's demo controls (SC-79) ---------------------------------------------------------------------------


class JourneyTrigger(Shape):
    """a scheduled run or a pending journey timer, and when it falls due (journey time, and the wall time it fires)"""

    id: str
    agent: str
    kind: Literal["run", "timer"]
    key: str
    ref: str | None = None
    due: str | None = None
    due_wall: str | None = None
    time: str | None = None
    blocked: str | None = None


class JourneyClockOut(Shape):
    now: str
    day: int
    day0: str
    day_minutes: int
    compressed: bool


class JourneyOut(Shape):
    live: bool
    clock: JourneyClockOut | None = None
    triggers: list[JourneyTrigger]


class JourneyResetInput(Shape):
    day_minutes: int | None = None
