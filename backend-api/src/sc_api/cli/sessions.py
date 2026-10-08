"""Firebase custom tokens for the people of Munchly's journey (SC-95), for the browser suites that sign them in without
a password: the Munchly Chips E2E suite (frontend/workspace/tests/journey) exchanges each at Identity Toolkit with the
app's own browser key and hands the session to the page, as the app's own sign-in would leave it.

- Each token is a JWT signed with the impersonated sc-api-local's own signer, as the walk's are (walk.Tokens): no
  password is handled, typed or printed. A token is good for an hour, and the session it starts refreshes itself.
- The people are the journey's members (reference/journey.json) and Neha, the console's staff, by member id; the uids
  are the ones hydrate gives them (identity.synthetic_uid). Nothing reads the database.

  backend-api/scripts/sessions.sh priya rakesh neha …     JSON on stdout: {id: {uid, email, name, role, token}}
  backend-api/scripts/sessions.sh --all                    every member and Neha
"""

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor

from sc_api.cli.walk import Tokens
from sc_api.identity import synthetic_uid
from sc_api.services.reference import load
from sc_api.settings import get_settings


def people() -> dict[str, dict[str, str]]:
    """every member of the journey, and Neha, by id"""
    s = get_settings()
    out = {
        m["id"]: {"email": m["login"], "name": m["name"], "role": m["role"], "org": m.get("org", "")}
        for m in load("journey.json")["members"]
    }
    out["neha"] = {
        "email": f"neha.kulkarni@{s.staff_email_domain}",
        "name": "Neha Kulkarni",
        "role": "staff",
        "org": "Smart-Clearance",
    }
    for p in out.values():
        p["uid"] = synthetic_uid(p["email"])
    return out


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="sc-sessions", description=__doc__.split("\n\n")[0])
    p.add_argument("who", nargs="*", help="member ids (neha for the console's staff)")
    p.add_argument("--all", action="store_true", help="every member and Neha")
    a = p.parse_args(argv)
    everyone = people()
    who = list(everyone) if a.all else a.who
    unknown = [w for w in who if w not in everyone]
    if not who or unknown:
        raise SystemExit(f"sc-sessions: name people by member id ({', '.join(unknown) or 'none given'})")
    signer = Tokens({w: everyone[w]["uid"] for w in who})
    with ThreadPoolExecutor(max_workers=8) as pool:
        tokens = dict(zip(who, pool.map(lambda w: signer.custom(everyone[w]["uid"]), who), strict=True))
    json.dump({w: {**everyone[w], "token": tokens[w]} for w in who}, sys.stdout)


if __name__ == "__main__":
    main()
