"""A kirana scheme filled for a demo (SC-215): design3/core/platform.js fillScheme, held to it by rules.json.

Every shop that hasn't answered orders its share as the story has it, within its cap and the packets left; whatever is
still left goes to the same shops in the same order, each up to its cap, so the scheme fills. A shop that ordered or
said Not this time is left alone. `story` is the story's own shares of those shops, so the console can say whether the
fill tops them up or stops at the packets left."""

from collections.abc import Iterable, Sequence
from typing import Any, TypedDict


class Shop(TypedDict):
    id: str
    share: int
    cap: int


def fill_scheme(shops: Sequence[Shop], answered: Iterable[str], left: int) -> dict[str, Any]:
    """the orders that fill a scheme: `shops` in the story's order, `answered` the shops that ordered or declined,
    `left` the packets left"""
    done = set(answered)
    open_ = [k for k in shops if k["id"] not in done]
    take: dict[str, int] = {}
    rest = max(0, left)
    for k in open_:
        n = min(k["share"], k["cap"], rest)
        if n > 0:
            take[k["id"]] = n
            rest -= n
    for k in open_:
        if not rest:
            break
        n = min(k["cap"] - take.get(k["id"], 0), rest)
        if n > 0:
            take[k["id"]] = take.get(k["id"], 0) + n
            rest -= n
    orders = [{"id": k["id"], "units": take[k["id"]]} for k in open_ if take.get(k["id"])]
    return {
        "orders": orders,
        "shops": len(orders),
        "units": sum(o["units"] for o in orders),
        "story": sum(min(k["share"], k["cap"]) for k in open_),
    }
