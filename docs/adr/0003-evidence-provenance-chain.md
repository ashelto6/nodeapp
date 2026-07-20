# 3. Enforce evidence provenance in the schema, not in prompts

- Status: accepted
- Date: 2026-07-20
- Issue: n/a (product architecture session)

## Context

Corevia's entire premise is that recommendations are backed by evidence gathered
from the actual business, that nothing is hallucinated, and that every claim is
explainable. Those are the differentiators — a generic AI audit tool is worth
nothing, and one that invents findings is worse than nothing because a single
fabricated claim in a cold email destroys credibility permanently.

The tempting implementation is instructional: tell the model to cite its
sources, tell it not to invent findings, review the output. This fails in the
ways prompt-based guarantees always fail — silently, intermittently, and more
often as prompts and models drift.

## Decision

Make provenance a structural property of the data model.

- `Evidence` records carry source URL, fetch timestamp, collector name and
  version, and a content hash of the raw artifact.
- `Finding` requires a non-empty `evidenceIds`. A finding cannot exist without
  evidence.
- `Recommendation` requires a non-empty `findingIds`.
- `Artifact` records the recommendation IDs it drew on, plus model and prompt
  version.
- A deterministic **citation check** parses every generated artifact for factual
  claims and verifies each resolves to a `Finding` ID. Artifacts with uncited
  claims are rejected automatically, before human review.

The chain is load-bearing. Schema changes that weaken any link are architectural
regressions, not conveniences.

## Alternatives considered

**Prompt-level instruction plus human review.** Far less work. Rejected: it
places the guarantee in the least reliable part of the system and makes the
human reviewer the only defense, which does not scale and degrades with
familiarity.

**Post-hoc fact-checking by a second model.** Retained as an advisory quality
pass, but rejected as the primary mechanism — model judgment is not trustworthy
enough to auto-reject work, and a checker that cannot be trusted to reject is
not a control.

**Evidence as free-text citations in generated output.** Rejected: unverifiable
mechanically, which defeats the purpose entirely.

## Consequences

- "No hallucinations" becomes a checkable property rather than an aspiration.
  The citation check is ordinary reference-checking software, not model
  judgment, and is therefore trustworthy enough to auto-reject.
- Interpreters can be restricted to consuming findings rather than raw page
  content — a model that cannot see the page cannot invent observations about
  it. This is a direct consequence of the chain existing.
- Re-analysis and diffing over time become possible, because evidence is
  timestamped and versioned. "This site got worse since we looked" becomes a
  query, and is itself a compelling outreach hook.
- Cost: more entities and more writes per analysis than a flat findings blob.
  Accepted — this chain is the product's actual moat, and the storage cost is
  trivial relative to what it protects.
- Cost: the citation check requires generated artifacts to be parseable for
  claims, which constrains output format (structured sections with citation
  markers rather than free prose). Accepted; it also makes reports more scannable
  for the recipient.
