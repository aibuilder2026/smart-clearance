"""Facts the contract shows twice, stored once: each is a client column, also served inside an agent's settings.

| agent setting                    | client column       |
| watcher.blinkitDays, .qcomPct    | gate_blinkit_days, gate_qcom_pct (the client's gates) |
| impact.returnWindowDays          | return_window_days  |
| lister.territoryGuard            | territory_guard     |
| gate.approver                    | approver_ref        |

The client's rules.reserve, .tokenPct and .scheme go the other way: they are read from the Lister's, the
Negotiator's and Outreach's settings. Its staff-sale cap is one column, also served as exits.staff.cap.
"""

MIRRORED: dict[str, dict[str, str]] = {
    "watcher": {"blinkitDays": "gate_blinkit_days", "qcomPct": "gate_qcom_pct"},
    "impact": {"returnWindowDays": "return_window_days"},
    "lister": {"territoryGuard": "territory_guard"},
    "gate": {"approver": "approver_ref"},
}

# the client's rules that are an agent's setting
RULES_FROM_AGENTS: dict[str, tuple[str, str]] = {
    "reserve": ("lister", "reserve"),
    "tokenPct": ("negotiator", "tokenPct"),
    "scheme": ("outreach", "scheme"),
}


def stored(agent_id: str, settings: dict) -> dict:
    """an agent's settings without the keys a client column holds"""
    keys = MIRRORED.get(agent_id, {})
    return {k: v for k, v in settings.items() if k not in keys}
