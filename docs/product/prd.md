# Corevia — Product Requirements (MVP)

> **Scope of this document.** What the MVP must do, what it must deliberately
> not do, and the gates between stages. Strategy and rationale live in
> [vision.md](vision.md); entities in [domain-model.md](domain-model.md); the AI
> component design in [agent-architecture.md](agent-architecture.md).
>
> **Sequencing and progress are not here.** Phase membership and status live in
> GitHub Milestones and Issues ([ADR-0001](../adr/0001-project-state-workflow.md)).
> This document defines *what*, not *when* or *how far along*.

## The MVP in one sentence

An internal operations tool that discovers businesses in one vertical and one
metro, screens them cheaply for online underperformance, and — for the best
prospects only — produces evidence-backed audit artifacts and personalized
outreach for human approval before anything is sent.

**The first and only customer is our own team.** There are no customer accounts,
no subscriptions, no billing, no CRM integration, and no self-serve anything.

## The two-stage funnel

The single most important structural requirement. The pipeline is **not** a
linear "discover → analyze → redesign → contact everyone" flow. It is two stages
with a qualification gate between them, because the stages have costs that
differ by two or three orders of magnitude.

### Stage 1 — Screen (cheap, deterministic, every prospect)

Runs against every discovered business. **No LLM calls whatsoever.** Cost is
fractions of a cent per prospect, dominated by page rendering.

Required checks:

- Reachability, HTTPS presence and certificate validity
- Mobile viewport handling and responsive behavior
- Lighthouse: performance, SEO, best-practices scores and Core Web Vitals
- axe-core: WCAG violations with severity and DOM selectors
- SEO structural checks: title, meta description, heading hierarchy, canonical,
  `robots.txt`, sitemap presence, structured data, image alt coverage
- Conversion basics: click-to-call presence, visible phone/address, contact
  form presence, business hours discoverability
- Technology fingerprint (platform, page builder, last-modified signals)

Output: a **scored, ranked opportunity list** with per-prospect findings. This
list is independently valuable regardless of anything downstream — it answers
whether the chosen vertical contains enough underperformers to be worth working
at all.

### Qualification gate

Only prospects passing an explicit threshold proceed. The threshold combines
opportunity score with plausible ability to pay. **This gate is a hard
requirement, not a tuning knob** — running Stage 2 on unqualified prospects is
the failure mode that inverts the unit economics.

### Stage 2 — Generate (expensive, AI, qualified prospects only)

Runs only past the gate. Real per-prospect cost in LLM tokens and rendering.

- Interpretation: findings become prioritized, business-contextual narrative
- Audit report: professional, evidence-cited, explainable
- Homepage redesign: a concrete demonstration, not a description of one
- Personalized outreach draft, grounded in that prospect's specific findings

**Report before redesign.** The report is cheaper, exercises the full evidence
chain end to end, and may well convert comparably — which Stage 1's validation
gate is positioned to reveal before redesign work is built.

## Functional requirements

### Discovery

- Select vertical and metro as explicit parameters (single values for MVP)
- Query a business data source and persist prospects with a stable dedupe key
- **The discovery source's terms of service constrain the schema.** What may be
  persisted, and for how long, is determined before the schema is written — not
  retrofitted. Sources whose terms forbid storing returned data beyond limited
  caching cannot back a prospect database, whatever their coverage advantage.
- Re-running discovery must not create duplicates

### Analysis

- Every analyzer produces typed `Finding` records against a shared taxonomy
- Every finding references `Evidence` carrying source URL, fetch timestamp,
  collector name and version, and a hash of the raw artifact
- Analysis runs are immutable and versioned, so a prospect re-analyzed months
  later can be diffed against its earlier state
- Analyzers are independently testable against fixture pages with known defects

### Generation

- Every generated artifact records the model, prompt version, token counts, and
  cost, attributed to its prospect
- Every factual claim in a generated artifact must resolve to a `Finding` ID.
  Artifacts containing uncited claims are rejected automatically — this is a
  mechanical check, not a review guideline
- Artifacts are versioned; regenerating never destroys the prior version

### Review and approval

- No outreach is sent without an explicit recorded human approval
- The approval record captures who, when, and what was changed before approval
- Rejection with reason is a first-class outcome that feeds quality iteration

### Outreach

- Sending uses a **dedicated domain, separate from the primary domain**, with
  SPF, DKIM, and DMARC configured and a deliberate warmup period
- A **global suppression list** is checked before every send. Suppression is
  permanent, applies across all modules and all future pipeline runs, and
  survives re-discovery of the same business
- Bounces and complaints are recorded and automatically suppress
- Every send is recorded as an `OutreachAttempt` with channel, status, and
  timestamps

### Compliance

Not a policy appendix — these are functional requirements with schema
consequences.

- Scraped contact addresses are treated as personal data by default
- Every outreach message identifies the sender and carries a working opt-out
- Opt-out requests are honored permanently via the suppression list
- The data source and collection date for every prospect is retained, so the
  question "where did you get my details" has a truthful answer
- **Geographic scope is a compliance decision.** US-only targeting for the MVP
  substantially reduces the regulatory surface compared to including Canada
  (CASL) or the EU (GDPR/ePrivacy).

## The validation gate

**Stage 1 completion is a hard checkpoint before Stage 2 begins.**

Stage 1 is done when it has produced roughly twenty ranked prospects with real
findings, exported in a form usable for hand-written outreach. At that point,
outreach is written and sent **by hand** — no generation pipeline — and replies
are counted.

That reply rate is the input to every downstream decision: whether Stage 2 is
worth building, how much may be spent per prospect, and whether the redesign is
necessary or whether a report converts identically for a fraction of the cost.

**Explicitly out of scope for Stage 1:** any LLM call, any generated artifact,
any review dashboard, any authentication work, any sending infrastructure. If
Stage 1 grows to include them, it has become scope creep against its own
purpose, which is to reach a measured reply rate quickly.

## Non-goals

Deliberately excluded from the MVP, each with the condition that would change it.

| Non-goal | Trigger to revisit |
| --- | --- |
| Customer accounts, subscriptions, billing | A paying customer needs self-serve access |
| Multi-tenancy | A second team or a customer operates the tool |
| CRM integration | Manual tracking becomes the bottleneck |
| Multiple verticals or regions | A second vertical's rubric can be written from real experience |
| Generalized module/plugin infrastructure | A second analysis module actually exists |
| Real authentication | A second human needs dashboard access (see below) |
| Distributed job queue | Concurrency or retry semantics become painful in the Mongo-backed queue |
| Public-facing marketing site | There is something to sell to someone who arrives cold |

## Infrastructure prerequisites triggered by this product

These exist as deferred items in the current repository with explicit triggers.
**Choosing Corevia fires three of them** — recorded here so the connection is
not lost.

- **MongoDB backups.** Gated on "real data worth protecting." Prospect records,
  evidence, and outreach history qualify immediately. Losing outreach history is
  worse than ordinary data loss: it means re-contacting people who opted out.
  Required before first outreach.
- **TLS/HTTPS.** Previously deferred pending a domain. A dashboard holding
  business contact data over plain HTTP is not acceptable once real prospect
  data exists. Required before the dashboard is exposed beyond localhost.
- **Access control on the dashboard.** "No authentication" is correct about
  *customer* accounts and wrong about *access*. The cheapest honest MVP answer
  is not to expose the dashboard publicly at all — localhost binding behind an
  SSH tunnel, or nginx basic-auth plus an IP allowlist. Real token-based auth
  waits for a second human, and should be token-based when it arrives given the
  declared React Native direction.

## Success criteria

The MVP succeeds if it answers, with evidence rather than opinion:

1. Does the chosen vertical and metro contain enough underperforming businesses
   to sustain a pipeline?
2. What fraction of evidence-backed cold outreach receives a reply?
3. What does a fully-generated prospect cost, and does that cost survive the
   observed conversion rate?
4. Are generated artifacts good enough to send without meaningful hand-editing?

A clear "no" on any of these is a successful MVP outcome. It is substantially
cheaper to learn it here than after the platform is built.
