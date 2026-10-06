"""Time and ids, injected so a service never reads the wall clock or a random source of its own.

The API runs on the real clock and random ids. The hydrate CLI runs a simulated clock, which spreads its history over
days, and seeded ids, so the same seed builds the same database. Tests fix the clock.
"""

import secrets
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from random import Random
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz"


class Clock:
    def now(self) -> datetime:
        return datetime.now(UTC)

    def today(self) -> date:
        return self.now().astimezone(IST).date()


@dataclass
class FixedClock(Clock):
    """A clock that stands still until moved: the tests', and the simulated history's."""

    at: datetime

    def now(self) -> datetime:
        return self.at

    def set(self, at: datetime) -> None:
        self.at = at

    def advance(self, **delta: float) -> datetime:
        self.at = self.at + timedelta(**delta)
        return self.at


class Ids:
    """Public ids the frontend shows and links to: p-…, st-…, rq-…"""

    def token(self, n: int = 8) -> str:
        return "".join(secrets.choice(ALPHABET) for _ in range(n))

    def new(self, prefix: str, n: int = 8) -> str:
        return f"{prefix}-{self.token(n)}"


@dataclass
class SeededIds(Ids):
    seed: int
    _rng: Random = field(init=False)

    def __post_init__(self) -> None:
        self._rng = Random(f"ids:{self.seed}")

    def token(self, n: int = 8) -> str:
        return "".join(self._rng.choice(ALPHABET) for _ in range(n))


def ist(year: int, month: int, day: int, hour: int = 0, minute: int = 0) -> datetime:
    """An Indian wall-clock time, as an aware datetime."""
    return datetime(year, month, day, hour, minute, tzinfo=IST)
