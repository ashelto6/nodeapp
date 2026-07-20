# Corevia — Domain Model

> **Scope.** The entities, their relationships, and the invariants that must
> hold. This is the conceptual model, not a Mongoose schema dump — field lists
> are indicative and the authoritative schema is the code under
> `server/src/modules/*/models/`.
>
> Requirements this serves: [prd.md](prd.md). AI component design:
> [agent-architecture.md](agent-architecture.md).

## The provenance chain

The central structure. Everything else hangs off it.

```
Prospect
   └─< AnalysisRun            (immutable, versioned execution record)
         └─< Evidence         (raw artifact + where and when it came from)
               └─< Finding    (a typed, detected problem)
                     └─< Recommendation
                           └─< Artifact        (report / redesign / email draft)
                                 ├─ ReviewDecision
                                 └─< OutreachAttempt

SuppressionEntry               (global, standalone, checked before every send)
```

**The invariant that makes the company work:** a `Recommendation` cannot exist
without `Finding`s, and a `Finding` cannot exist without `Evidence` carrying a
source URL, a fetch timestamp, and the identity of the collector that produced
it. Enforced this way, "every recommendation is explainable" stops being a
prompt instruction and becomes a property of the database — one that a
mechanical check can verify, and that no amount of model drift can erode.

This chain is the reason the product philosophy's "no hallucinations, no generic
suggestions" is achievable at all. It should be treated as load-bearing, and
schema changes that weaken it should be treated as architectural regressions.

## Entities

### Prospect

A business that has been discovered. The root of everything.

- Identity: name, address, geo coordinates, phone, website URL
- `dedupeKey` — stable across re-discovery; re-running discovery must update,
  never duplicate
- `source` — which provider it came from, plus the provider's own record ID
- `discoveredAt`, `sourceTermsClass` — retained so "where did you get my
  details" has a truthful answer, and so records from a provider whose terms
  restrict retention can be identified and purged as a set
- `vertical`, `region` — single values in the MVP, but modeled as fields from
  the start so narrowing is a data choice rather than a hardcoded assumption
- `screeningScore`, `qualificationStatus` — the output of Stage 1 and the gate
  into Stage 2

**Deliberately absent:** contact person names. Adding named individuals converts
this from business data into unambiguous personal data with a materially heavier
compliance burden. When outreach needs a name, that is a decision to make
explicitly, not to drift into.

### AnalysisRun

One execution of the analysis pipeline against one prospect. **Immutable.**

- `prospectId`, `startedAt`, `completedAt`, `status`
- `pipelineVersion`, and the version of every analyzer that participated
- `stage` — screening or deep analysis

Immutability is the point. Websites change and analyzers change; without
versioned, append-only runs there is no way to tell whether a difference between
two analyses reflects a changed site or changed code. Re-analysis creates a new
run and leaves the old one intact, which makes "this site got worse since we
looked" a query rather than a guess — and that is itself a compelling outreach
hook.

### Evidence

A raw collected artifact with its provenance. The leaf that everything else
cites.

- `analysisRunId`, `collectorName`, `collectorVersion`
- `sourceUrl`, `fetchedAt`
- `contentHash`, and a pointer to the stored artifact (HTML, screenshot,
  Lighthouse JSON, axe results)
- `mediaType`

Large binaries are referenced, not embedded — screenshots and full page HTML
belong in object storage or on disk with the document holding a pointer.
Inlining them into MongoDB documents will hit the 16MB document limit and make
every query that touches a prospect expensive.

### Finding

A specific detected problem. Produced by deterministic analyzers, never by an
LLM (see [agent-architecture.md](agent-architecture.md)).

- `evidenceIds` — one or more; required, non-empty
- `module` — `website` for the first module; present from the start so later
  modules share the taxonomy without a migration
- `code` — a stable taxonomy identifier (`a11y.contrast.insufficient`,
  `seo.title.missing`, `conv.phone.not-clickable`)
- `severity`, `confidence`
- `selector` / `location` — where on the page, when applicable
- `measuredValue`, `expectedValue` — the numbers that make it citable

The stable `code` taxonomy is what lets rubrics, scoring, and prompt templates
be written against findings rather than against free text. Prose descriptions
belong in a lookup keyed by code, not in the finding itself.

### Recommendation

A proposed change, derived from findings.

- `findingIds` — required, non-empty
- `priority`, `estimatedImpact`, `effort`
- `rationale` — the business-contextual explanation
- `generatedBy` — which interpreter produced it, with prompt and model version

### Artifact

A generated deliverable: audit report, homepage redesign, outreach draft.

- `type`, `prospectId`, `recommendationIds`
- `version` — monotonic; regeneration never destroys a prior version
- `content` or a storage pointer
- `model`, `promptVersion`, `inputTokens`, `outputTokens`, `costUsd`
- `citationCheckStatus` — whether every claim resolved to a Finding
- `reviewStatus`

Cost fields are populated from the first generated artifact. Unit economics
decide whether this business works, and per-prospect cost cannot be
reconstructed after the fact.

### ReviewDecision

The human approval record. No outreach exists without one.

- `artifactId`, `reviewer`, `decidedAt`, `decision`
- `edits` — what changed between generated and approved, which is the highest-
  signal quality feedback the system produces
- `rejectionReason` — a first-class outcome, not an error

### OutreachAttempt

- `prospectId`, `artifactId`, `reviewDecisionId`, `channel`
- `sentAt`, `status` (queued, sent, bounced, replied, complained)
- `sendingDomain`, `messageId` — needed to correlate deliverability problems
- `suppressionCheckedAt` — proof the check ran

### SuppressionEntry

Standalone by design. **Not** a flag on Prospect.

- `matchType` (email, domain, business), `matchValue`
- `reason` (opt-out, bounce, complaint, manual), `createdAt`

It is separate from Prospect because suppression must outlive the record that
caused it. If a business is deleted, re-discovered under a new provider ID, or
reached through a future module, the suppression must still apply. A boolean on
Prospect silently fails every one of those cases, and each failure is a
compliance incident rather than a bug.

## Deliberately absent from the MVP

Recorded so the reasoning is not lost:

- **User / Account / Tenant.** One internal operator; access is controlled at
  the network layer, not the data layer. Trigger: a second human needs access.
- **Campaign / Sequence.** Multi-touch follow-up sequences are a real
  requirement eventually and a distraction now. Trigger: single-touch reply
  rates justify investing in follow-up.
- **Customer / Engagement / Invoice.** Deals are tracked outside the system
  until the volume makes that painful.
- **Competitor, Review, GBP entities.** Future modules. The `module` field on
  Finding is the only accommodation made for them, and it costs nothing.

## Storage notes

MongoDB fits this model well — analysis artifacts are genuinely document-shaped,
schemas evolve as analyzers are added, and there are no meaningful cross-entity
transactions in the pipeline. The known pressure points:

- **Large binaries** must be referenced, not embedded (see Evidence).
- **The job queue is Mongo-backed** for now; see
  [ADR-0005](../adr/0005-mongo-backed-job-queue.md) for the reasoning and the
  named trigger for replacing it.
- **Suppression lookups happen on every send** and must be indexed on
  `matchValue`.
- **Cost aggregation across prospects** is a reporting query that will grow;
  if it becomes slow, a rollup collection is the answer, not a second database.
