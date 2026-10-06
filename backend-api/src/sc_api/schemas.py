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


class SkuOut(Shape):
    id: str
    code: str
    brand: str
    name: str
    mrp: float
    gst: float
    life_days: int


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
