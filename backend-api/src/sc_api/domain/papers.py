"""What the certificate of destruction states beyond the evidence (SC-174, option B), as design3's ledger.js lays it out
(destructionDetail, and papers.js destructionLog): the goods, the reason, the agency's method and facility, the day and
the window the packs were destroyed in, its supervising officer and the two independent witnesses (one on the agency's
panel signs with the specimen it keeps), who handed the packs over, and the log from the godown to the cover.
history.py's certificates are held to design3's (journey.json history.batches[].destruction.log)."""

from datetime import datetime, timedelta
from typing import Any

from sc_api.domain.money import r2

FMT = "%Y-%m-%dT%H:%M"


def _plus(iso: str, minutes: int) -> str:
    return (datetime.strptime(iso, FMT) + timedelta(minutes=minutes)).strftime(FMT)


def _fy_short(iso: str) -> str:
    y, mth = int(iso[:4]), int(iso[5:7])
    start = y if mth >= 4 else y - 1
    return f"{start % 100:02d}-{(start + 1) % 100:02d}"


def _possessive(name: str) -> str:
    return f"{name}'" if name.endswith("s") else f"{name}'s"


def destruction_log(d: dict[str, Any]) -> list[dict[str, Any]]:
    """the destruction step by step, from the godown to the cover (papers.js destructionLog): worked out from the two
    photos' times, the window, the agency's facility, vehicle and method, and the packs"""
    on, win = d["destroyedOn"], d["window"]
    start, end = f"{on}T{win['from']}", f"{on}T{win['to']}"
    shot = ((d.get("photos") or {}).get("before") or {}).get("at")
    # the before photo's time, where it leaves room to load and drive before the window opens
    before = (
        shot
        if shot and datetime.strptime(shot, FMT) <= datetime.strptime(start, FMT) - timedelta(minutes=35)
        else _plus(start, -75)
    )
    seq = str(d["no"]).split("/")[-1]
    burnt = d.get("method") == "incineration"
    span = int((datetime.strptime(end, FMT) - datetime.strptime(start, FMT)).total_seconds() // 60)
    mid = _plus(start, max(5, min(15, span - 5)))
    kg = lambda n: f"{r2(n):.2f} kg"  # noqa: E731
    return [
        {
            "at": before,
            "step": "Photographed at the godown",
            "detail": f"{d['units']} packs at {d['from']}, the carton's batch label in view",
            "photo": "before",
        },
        {
            "at": _plus(before, 20),
            "step": "Loaded",
            "detail": f"On {_possessive(d['agency'])} covered vehicle {d['vehicle']}, sealed with seal SL-{seq}",
        },
        {
            "at": _plus(start, -15),
            "step": "Received and weighed",
            "detail": f"{kg(d['kg'])} on weighbridge slip WB/{_fy_short(on)}/{seq}, at the facility's gate",
        },
        {
            "at": start,
            "step": "Fed to the incinerator" if burnt else "Slit open and emptied",
            "detail": "Whole, at 850 °C or more; the plastic packaging set aside first"
            if burnt
            else "Into the active cell, the plastic packaging set aside",
        },
        {
            "at": mid,
            "step": "Burnt" if burnt else "Buried and covered",
            "detail": "The ash to the facility's secured landfill" if burnt else "Covered with 30 cm of soil",
        },
        {
            "at": end,
            "step": "Photographed with the slate",
            "detail": f"Slate: {d['batch']} · {d['units']} packs · {on[8:10]}/{on[5:7]}/{on[:4]}",
            "photo": "after",
        },
        {
            "at": _plus(end, 10),
            "step": "Packaging sent on",
            "detail": f"{kg(d['packKg'])} of plastic film to an EPR-registered recycler",
        },
    ]


def destruction_detail(
    dz: dict[str, Any],
    agency: dict[str, Any],
    methods: dict[str, Any],
    sku: dict[str, Any],
    batch: dict[str, Any],
    dist: dict[str, Any],
) -> dict[str, Any]:
    """the certificate in full (ledger.js destructionDetail): `dz` the destruction as the case keeps it, `agency` its
    record on the client's list, `methods` the setup's, `sku` and `batch` as money.js reads them, `dist` the
    distributor's identity"""
    after = (dz.get("photos") or {}).get("after") or {}
    before = (dz.get("photos") or {}).get("before") or {}
    after_at = after.get("at") or ""
    on = after_at[:10]
    win = dz.get("window") or {
        "from": (datetime.strptime(after_at, FMT) - timedelta(minutes=25)).strftime("%H:%M"),
        "to": after_at[11:16],
    }
    panel = agency.get("witnesses") or []
    given = dz.get("witnesses") or panel

    def witness(w: dict[str, Any]) -> dict[str, Any]:
        p = next((x for x in panel if x.get("name") == w.get("name")), None)
        return {
            "name": w.get("name", ""),
            "address": w.get("address") or (p or {}).get("address") or "",
            "proof": w.get("proof") or (p or {}).get("proof"),
            "sign": (p or {}).get("sign"),
        }

    method = agency.get("method") or "landfill"
    how = methods.get(method) or {}
    units = int(dz["units"])
    kg, pack_kg = r2(units * float(sku.get("kgPerUnit") or 0)), r2(units * float(sku.get("packKg") or 0))
    photos = {
        "before": {
            "name": before.get("name") or "before",
            "at": before.get("at"),
            **({"object": before["object"]} if before.get("object") else {}),
        },
        "after": {
            "name": after.get("name") or "after",
            "at": after_at,
            **({"object": after["object"]} if after.get("object") else {}),
        },
    }
    sig = dist.get("signatory")
    out = {
        "reason": "expiry",
        "methodId": method,
        "methodName": how.get("name", ""),
        "methodHow": how.get("how", ""),
        "facility": agency.get("facility"),
        "vehicle": agency.get("vehicle"),
        "officer": agency.get("officer"),
        "seal": agency.get("seal"),
        "witnesses": [witness(w) for w in given],
        "window": win,
        "destroyedOn": on,
        "photos": photos,
        "handedBy": {"name": sig["name"], "title": sig["title"], "sign": sig.get("sign")} if sig else None,
        "goods": f"{sku.get('brand', '')} {sku.get('name', '')}".strip(),
        "mfg": batch.get("mfg"),
        "mrp": sku.get("mrp"),
        "perCarton": sku.get("perCarton"),
    }
    out["log"] = destruction_log(
        {
            "units": units,
            "kg": kg,
            "packKg": pack_kg,
            "batch": batch.get("id"),
            "no": dz.get("certificate") or "",
            "from": dist.get("godown") or "",
            "destroyedOn": on,
            "window": win,
            "photos": photos,
            "agency": agency.get("name", ""),
            "vehicle": agency.get("vehicle") or "",
            "facility": agency.get("facility") or {},
            "method": method,
        }
    )
    return out
