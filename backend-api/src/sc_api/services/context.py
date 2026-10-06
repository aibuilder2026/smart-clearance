"""What every service call carries: the database session, who is acting, the clock, the id source, the identity
provider (Firebase), the settings and the reference data. The API builds one per request; the hydrate CLI builds one
per simulated actor, with its simulated clock and seeded ids, so both go through exactly the same code.
"""

import uuid
from dataclasses import dataclass, field, replace
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from sc_api.domain.clock import Clock, Ids
from sc_api.errors import ApiError
from sc_api.services.reference import Reference
from sc_api.settings import Settings

if TYPE_CHECKING:
    from sc_api.identity import IdentityProvider


@dataclass(frozen=True)
class Actor:
    """who a change is made by: a signed-in staff member, a client's person (in an imported history), or the
    platform itself (the hydrate CLI's setup)"""

    name: str
    user_id: uuid.UUID | None = None
    staff_ref: str | None = None
    role: str | None = None
    permissions: frozenset[str] = field(default_factory=frozenset)

    def require(self, permission: str, refusal: str) -> None:
        if permission not in self.permissions:
            raise ApiError(403, refusal)


SYSTEM = Actor(name="Smart-Clearance", permissions=frozenset({"*"}))


@dataclass(frozen=True)
class Ctx:
    session: AsyncSession
    actor: Actor
    clock: Clock
    ids: Ids
    identity: IdentityProvider
    settings: Settings
    ref: Reference

    def acting_as(self, actor: Actor) -> Ctx:
        return replace(self, actor=actor)

    def require(self, permission: str, refusal: str) -> None:
        if "*" not in self.actor.permissions:
            self.actor.require(permission, refusal)
