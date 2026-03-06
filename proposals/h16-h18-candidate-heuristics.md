# Candidate Heuristics H16–H18

Status: Proposal (Draft)

These heuristics are intentionally NOT part of the current document.

They represent patterns frequently observed in mature agent workflows,
but the repository currently follows H13:

"Iterate from observed failure, not imagined perfection."

These heuristics should only be adopted if real usage of the repository
reveals recurring failure modes that justify them.

---

# H16 — Externalize Important Intermediate State

## Summary

Significant decisions, assumptions, and task plans should be written into
durable artifacts rather than relying on conversational context.

## Why It Matters

Agent sessions are inherently ephemeral.

Important reasoning steps can disappear due to:

- session resets
- context window limits
- orchestration changes
- model switching

Persisting intermediate artifacts improves:

- reproducibility
- debugging
- cross-session continuity
- human inspection

## Typical Artifacts

Examples include:

- task plans
- design memos
- decision logs
- assumption lists
- verification summaries
- investigation notes

## Warning

This heuristic must be applied carefully.

Over-documentation creates unnecessary process friction.

The intent is **lightweight persistence**, not bureaucracy.

---

# H17 — Calibrate Task Granularity

## Summary

Agent tasks should be sized so they are:

- small enough to verify
- large enough to avoid orchestration overhead

## Why It Matters

Poor task sizing causes many agent failures.

Tasks that are too large create:

- ambiguous termination
- drifting context
- hidden assumptions

Tasks that are too small create:

- excessive coordination
- fragmentation of reasoning
- unnecessary overhead

## Guideline

The ideal task size is one where:

- completion criteria are explicit
- verification cost is manageable
- failure can be diagnosed locally

---

# H18 — Prefer Reversible Changes When Uncertainty Is High

## Summary

When agents operate under uncertainty, prefer changes that are easy to undo.

## Why It Matters

Agent workflows often operate with incomplete context.

Reversible actions reduce the blast radius of mistakes.

Examples include:

- small commits
- isolated edits
- feature flags
- incremental refactors

This allows experimentation while preserving system safety.

---

# Why These Are Not Yet Part of the Main Document

The repository currently prioritizes:

- readability
- minimal heuristic count
- iterative refinement

If the heuristics grow too quickly, the document risks violating its
own principles:

- H01 — Prefer the thinnest viable workflow
- H12 — Continuously prune and consolidate
- H13 — Iterate from observed failure

These candidate heuristics are therefore proposed for future evaluation
rather than immediate adoption.
