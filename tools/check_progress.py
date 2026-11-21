#!/usr/bin/env python3
"""Validate durable phase checkpoints without pretending tests have run."""
from __future__ import annotations
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
VALID = {"TODO", "IN_PROGRESS", "BLOCKED", "DONE"}

def main() -> int:
    try:
        data = json.loads((ROOT / "progress.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: cannot read progress.json: {exc}")
        return 1
    phases = data.get("phases")
    if data.get("schema_version") != 1 or not isinstance(phases, list):
        print("ERROR: unsupported checkpoint schema")
        return 1
    ids = [phase.get("id") for phase in phases]
    errors = []
    if ids != list(range(1, len(ids) + 1)):
        errors.append("phase IDs must be contiguous and ordered")
    for phase in phases:
        status, checks, evidence = phase.get("status"), phase.get("checks"), phase.get("evidence")
        if status not in VALID or not isinstance(checks, dict) or not checks or not isinstance(evidence, list):
            errors.append(f"phase {phase.get('id')}: malformed status/checks/evidence")
            continue
        if any(type(value) is not bool for value in checks.values()):
            errors.append(f"phase {phase['id']}: every acceptance check must be boolean")
        if status == "DONE":
            missing = [name for name, passed in checks.items() if passed is not True]
            if missing or not evidence or not all(isinstance(item, str) and item.strip() for item in evidence):
                errors.append(f"phase {phase['id']} marked DONE without passing checks/evidence: {missing}")
    current = data.get("current_phase")
    if type(current) is not int or current not in ids:
        errors.append("current_phase must refer to an existing phase")
    for rel in ("docs/IPC_PROTOCOL.md", "docs/PHASE_CHECKLIST.md", "docs/CHECKPOINT.md"):
        if not (ROOT / rel).is_file():
            errors.append(f"required checkpoint artifact missing: {rel}")
    if errors:
        print("\n".join(f"ERROR: {item}" for item in errors))
        return 1
    complete = sum(phase["status"] == "DONE" for phase in phases)
    print(f"Checkpoint valid: {complete}/{len(phases)} phases DONE; current phase {current}.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
