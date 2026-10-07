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


# --- a client's journey clock (SC-66) -----------------------------------------------------------------------------

DAY_MINUTES = 1440


@dataclass(frozen=True)
class JourneyClock:
    """A client's journey time: anchor + the wall time since the anchor, sped up so one journey day lasts `speed`
    minutes of wall time (1440: real time). The console sets the speed (clients.day_minutes); it applies while a case
    is open, and real time runs between cases. Each change of speed re-anchors at that moment, so journey time never
    jumps (services/journey/clock.py)."""

    anchor_wall: datetime
    anchor_journey: datetime
    speed: int = DAY_MINUTES

    @property
    def factor(self) -> float:
        return DAY_MINUTES / self.speed

    def at(self, wall: datetime) -> datetime:
        """the journey time at a wall time"""
        return self.anchor_journey + (wall - self.anchor_wall) * self.factor

    def wall_of(self, at: datetime) -> datetime:
        """the wall time a journey time falls at"""
        return self.anchor_wall + (at - self.anchor_journey) / self.factor

    def today(self, wall: datetime) -> date:
        return self.at(wall).astimezone(IST).date()

    def reanchored(self, wall: datetime, speed: int) -> JourneyClock:
        return JourneyClock(anchor_wall=wall, anchor_journey=self.at(wall), speed=speed)


def real_time(wall: datetime) -> JourneyClock:
    return JourneyClock(anchor_wall=wall, anchor_journey=wall, speed=DAY_MINUTES)


def journey_morning(day: date, hour: int = 8) -> datetime:
    """08:00 in India on a journey day: where a journey starts, just before the Data agent's 08:30 and the Watcher's
    09:00"""
    return datetime(day.year, day.month, day.day, hour, 0, tzinfo=IST)


# --- the length of a journey day, as the console sets it (SC-68), in design3/core/platform.js's words ------------

DAY_MINUTES_ERROR = "Enter a whole number of minutes, from 1 to 1,440."


def day_words(m: int) -> str:
    """a length of day in words: 5 → "5 minutes", 90 → "1 h 30 min", 120 → "2 hours", 1440 → "a day" """
    if m >= DAY_MINUTES:
        return "a day"
    if m >= 60:
        return f"{m // 60} h {m % 60} min" if m % 60 else f"{m // 60} hour{'' if m == 60 else 's'}"
    return f"{m} minute{'' if m == 1 else 's'}"


def day_minutes_error(value: object) -> str | None:
    """what a length of day must be (a whole number of minutes, 1 to 1440), or the problem with it"""
    whole = isinstance(value, int) and not isinstance(value, bool)
    return None if whole and 1 <= value <= DAY_MINUTES else DAY_MINUTES_ERROR  # type: ignore[operator]


def day_minutes_line(client_name: str, to: int, was: int) -> str:
    """the audit line for a change of a client's length of day"""
    return f"Set the length of a journey day for {client_name} to {day_words(to)} (was {day_words(was)})"
