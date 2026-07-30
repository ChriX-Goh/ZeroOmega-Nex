from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding="utf-8")
    if old not in content:
        raise SystemExit(f"missing expected text in {path}: {old!r}")
    target.write_text(content.replace(old, new), encoding="utf-8")


replace(
    "docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md",
    "- Product completion: **unknown pending full parity audit**.",
    "- Provisional total progress: **46%** with a **42%–50% confidence band**, calculated by `docs/PROJECT_PROGRESS_MODEL.md`.",
)
replace(
    "docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md",
    "Until then, completion must be reported as **unknown pending full parity audit**, never inferred from code volume, test counts or matrix row counts.",
    "Until the complete audit narrows the confidence band, every substantive report must provide the provisional audit-weighted percentage from `PROJECT_PROGRESS_MODEL.md`, its confidence band and the evidence delta. The percentage must never be inferred from code volume, test counts or old matrix row counts, and it must never be described as release readiness.",
)

replace(
    "docs/MILESTONE_8_STATUS.md",
    "**Completion percentage:** unknown pending full Original ↔ Nex parity audit",
    "**Provisional total progress:** 46% (confidence band 42%–50%)",
)
replace(
    "docs/MILESTONE_8_STATUS.md",
    "Milestone 8 is not 100% complete and is not currently close enough to release for a defensible percentage estimate.",
    "Milestone 8 is not 100% complete and is not release-ready. The current audit-weighted progress baseline is 46%, with a 42%–50% confidence band while the complete Original and Nex inventories remain open.",
)
replace(
    "docs/MILESTONE_8_STATUS.md",
    "- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`",
    "- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`\n- `docs/PROJECT_PROGRESS_MODEL.md`",
)

replace(
    "docs/MILESTONE_8_SESSION_7_CHECKPOINT.md",
    "- Completion percentage: unknown pending full Original ↔ Nex audit.",
    "- Provisional total progress: 46% with a 42%–50% confidence band under `PROJECT_PROGRESS_MODEL.md`.",
)
replace(
    "docs/MILESTONE_8_SESSION_7_CHECKPOINT.md",
    "2. `docs/MILESTONE_8_STATUS.md`",
    "2. `docs/PROJECT_PROGRESS_MODEL.md`\n3. `docs/MILESTONE_8_STATUS.md`",
)
replace(
    "docs/MILESTONE_8_SESSION_7_CHECKPOINT.md",
    "3. `docs/MILESTONE_8_RELEASE_CANDIDATE.md`\n4. `docs/MILESTONE_8_VERIFICATION_HEAD.md`",
    "4. `docs/MILESTONE_8_RELEASE_CANDIDATE.md`\n5. `docs/MILESTONE_8_VERIFICATION_HEAD.md`",
)

replace(
    "docs/ACTIVE_PARITY_AUDIT_INDEX.md",
    "- Completion percentage: unknown pending complete parity audit.",
    "- Provisional total progress: 46% (confidence band 42%–50%).",
)
replace(
    "docs/ACTIVE_PARITY_AUDIT_INDEX.md",
    "- Current audit/implementation Head: `c6415a357522c61a505515466bc3140f06c7d0e9` before this documentation sync.",
    "- Progress authority: `docs/PROJECT_PROGRESS_MODEL.md`.\n- Active journey: Order 1 at 25%.\n- Current implementation includes exact original Ω geometry and source-derived color-state decisions; neither closes the toolbar journey.",
)
replace(
    "docs/ACTIVE_PARITY_AUDIT_INDEX.md",
    "exact source-certain Ω geometry port and tests committed; runtime screenshots still absent",
    "exact source-certain Ω geometry and color-state models with tests committed; runtime screenshots still absent",
)
replace(
    "docs/ACTIVE_PARITY_AUDIT_INDEX.md",
    "- `apps/extension/src/lib/original-toolbar-icon.test.ts` locks the original 16/19/24/32/38 size set, outer radius `0.375`, inner radius `0.25`, line width `0.25`, two-color fill and one-color `destination-out` behavior;",
    "- `apps/extension/src/lib/original-toolbar-icon.test.ts` locks the original 16/19/24/32/38 size set, outer radius `0.375`, inner radius `0.25`, line width `0.25`, two-color fill and one-color `destination-out` behavior;\n- `apps/extension/src/lib/original-toolbar-icon-state.ts` and its test lock the original static, inclusive and Direct outer/inner color decisions from `actionForUrl`;",
)
replace(
    "docs/ACTIVE_PARITY_AUDIT_INDEX.md",
    "- test commit: `40c3a64c23b730bf9c738a70c4e739f86ebb3071`;",
    "- geometry test commit: `40c3a64c23b730bf9c738a70c4e739f86ebb3071`;\n- color-state product commit: `fc56da9d33dfb71e3c979bb5ab9f502dbdc05b55`;\n- color-state test commit: `09a9a587723ebbc1967c804e40f77e8cba1e7b4b`;",
)
