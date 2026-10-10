"""Every party's identity on its GST papers (SC-148), as the story sets it: the client's, each distributor's and the
buyer's. Every GSTIN is fictional, built on a PAN whose four digits are 0000, which are never issued."""

from typing import Any

from sc_api import models as m
from sc_api.services.context import Ctx
from sc_api.services.journey import world

BUYER_DETAILS = ("state", "stateCode", "address", "gstin", "pan", "kind")
CLIENT_IDENTITY = ("pan", "cin", "address", "state", "stateCode", "email")


async def parties(ctx: Ctx, c: m.Client, j: dict[str, Any]) -> None:
    """every party's identity as the story sets it: the client's (its GSTIN, PAN, CIN, address and state), each
    distributor's (his GSTIN and address, his PAN, state code, FSSAI licence, e-mail and bank) and the buyer's (his
    GSTIN and PAN). A live build and Reset journey set it, so a workspace built before gains it"""
    c.workspace_doc = {
        **(c.workspace_doc or {}),
        "gstin": j["client"]["gstin"],
        "fssai": j["client"]["fssai"],
        "identity": {k: j["client"].get(k) for k in CLIENT_IDENTITY},
    }
    for x in j["distributors"].values():
        d = await ctx.session.get(m.Distributor, (c.id, x["id"]))
        if d is None:
            continue
        d.address, d.gstin = x.get("address"), x.get("gstin")
        d.details = {k: x[k] for k in world.DIST_IDENTITY if x.get(k) is not None}
    b = j["buyer"]
    row = await ctx.session.get(m.Partner, (c.id, b["id"]))
    if row is not None:
        row.details = {**(row.details or {}), **{k: b.get(k) for k in BUYER_DETAILS}}
