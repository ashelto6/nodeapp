# 2. Split the pipeline into cheap deterministic screening and expensive AI generation

- Status: accepted
- Date: 2026-07-20
- Issue: n/a (product architecture session)

## Context

The original Corevia concept describes a linear pipeline: discover businesses,
analyze them, generate a homepage redesign, produce a report, generate outreach.
Applied uniformly, every discovered business receives every stage.

The stages differ enormously in cost. Deterministic screening — fetching a page,
running Lighthouse and axe-core, checking SEO structure — costs fractions of a
cent, dominated by rendering. Generation costs real money in LLM tokens and,
for redesigns, possibly image generation. Call it low single-digit dollars per
prospect fully loaded.

Run that through a plausible funnel: 1,000 prospects at $2 each is $2,000 of
compute. At a 2% reply rate and a 15% close rate, that is three customers, or
roughly $667 of compute-only customer acquisition cost — before any of the
founder's time. That is defensible for a $5,000 engagement and fatal for a
$99/month subscription.

The cost structure therefore determines the pipeline's shape, and a uniform
linear pipeline commits to the worst version of it.

## Decision

The pipeline has two stages separated by an explicit qualification gate.

**Stage 1 — Screen.** Deterministic only, no LLM calls, run against every
discovered prospect. Produces typed findings and a ranked opportunity score.

**Qualification gate.** Only prospects passing an explicit threshold — combining
opportunity score with plausible ability to pay — proceed.

**Stage 2 — Generate.** AI interpretation, report, redesign, outreach copy. Runs
only on qualified prospects.

Within Stage 2, the report is built before the redesign: it is cheaper, it
exercises the full evidence chain end to end, and validation may show it
converts comparably.

Per-prospect cost instrumentation (model, tokens, dollars) is recorded from the
first AI call rather than added later.

## Alternatives considered

**Uniform linear pipeline.** Simpler to build and reason about. Rejected: it
maximizes spend on exactly the prospects least likely to convert, and it
provides no mechanism to discover that before the money is spent.

**Generate on reply only.** Cheapest possible — send a plain email, generate
artifacts only for prospects who respond. Rejected as the default because it
discards the core differentiator: the evidence-before-the-sale demonstration is
the reason a reply happens at all. Worth revisiting as a variant to A/B test
once a baseline reply rate exists.

**Manual qualification.** A human picks who advances. Rejected as the mechanism
but retained as the fallback — the gate's threshold is tunable and can be set to
"operator selects" while the scoring model is unproven.

## Amendment (2026-07-20): what the gate actually buys at real volume

The decision stands; the reasoning above overstates its own case and is
corrected here rather than left to mislead a future reader.

The 1,000-prospect example was written before delivery capacity was established
at **2–3 jobs per month**. At that capacity the real figures are roughly
$300/month of compute for about $100 customer acquisition cost against a $2–5k
job — economically comfortable *with or without* the gate. The cost pressure the
argument leans on is not actually binding at this scale.

**At this volume the gate's real value is focusing scarce human review time**,
not saving money. That is still a good reason to keep it: attention is the
genuinely limited resource, and a gate that halves the number of artifacts
needing review is worth more than one that halves the compute bill.

Two consequences follow:

- Do not tune the threshold as though compute cost were the binding constraint.
  It is not. Tune it against review capacity and artifact quality.
- Limited delivery capacity is a reason to **qualify harder**, not to contact
  more people (see `../product/prd.md`, "Operating constraint: delivery
  capacity").

The cost argument becomes binding again if volume rises by an order of
magnitude — which is exactly the condition under which this ADR should be
re-read rather than assumed.

## Consequences

- Screening output is independently valuable: it answers whether the chosen
  vertical contains enough underperformers to be worth working, regardless of
  anything downstream.
- Unit economics become measurable early and are bounded by construction.
- Cost: the qualification threshold is a new tuning surface that will initially
  be wrong, and mis-set it either wastes generation spend or discards good
  prospects. Accepted — it is a number to tune with real data, and having the
  gate at all is what makes the tuning possible.
- The two stages have genuinely different infrastructure needs (screening is
  render-bound, generation is API-bound), which shapes concurrency and retry
  design in the worker.
