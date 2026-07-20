# Corevia — AI Agent Architecture

> **Scope.** How AI components are decomposed, what each is allowed to do, and
> the contracts between them. The governing decision — which work is
> deterministic and which is AI — is recorded in
> [ADR-0004](../adr/0004-deterministic-analysis-ai-interpretation.md).
>
> Entities referenced here are defined in [domain-model.md](domain-model.md).

## The governing principle

**Deterministic software detects. AI explains, prioritizes, and generates.**

The instinct to build an "accessibility agent" or an "SEO agent" should be
resisted, because those are solved deterministic problems. A WCAG rule engine
returns exact violations with DOM selectors and measured contrast ratios. An LLM
asked the same question returns plausible violations, some of which are
invented. For a company whose entire pitch is *evidence, not hallucination*,
using a language model to detect facts that a rule engine can measure is a
self-inflicted wound.

What AI is genuinely good at here is the layer above detection: turning a list
of technical violations into an argument a business owner cares about.

> A rule engine says: *contrast ratio 2.1:1 on the primary call-to-action.*
>
> An interpreter says: *your "Book Appointment" button is effectively invisible
> to someone standing outside in sunlight — which is exactly when people look up
> a dentist.*

The first sentence is the evidence. The second is the value. Only the second
needs a model.

## The five layers

| Layer | Deterministic? | Responsibility | Output |
| --- | --- | --- | --- |
| **Collectors** | Yes | Fetch HTML, render pages, screenshot, crawl, call business data APIs | `Evidence` |
| **Analyzers** | Yes | Lighthouse, axe-core, SEO rules, conversion checks, tech fingerprint | `Finding` |
| **Interpreters** | AI | Findings → prioritized, business-contextual narrative | `Recommendation` |
| **Generators** | AI | Audit report, homepage redesign, outreach copy | `Artifact` |
| **Critics** | Both | Verify claims resolve to findings; quality-gate before human review | pass/reject |

Each layer consumes only the layer above it. An Interpreter never fetches a page;
a Generator never invents a finding; a Collector never makes a judgment. These
are not stylistic preferences — they are what makes each layer independently
testable, which is the requirement the engineering principles actually demand.

### Collectors

Deterministic, and the only layer permitted to touch the network on a
prospect's behalf. Each collector records its own name and version into every
`Evidence` record it produces, so a finding can always be traced to the exact
code that observed it.

Collectors that render pages run in a **separate browser service**, not in the
API process — see [ADR-0006](../adr/0006-browser-as-separate-service.md).

### Analyzers

Deterministic rule engines producing typed `Finding` records against the shared
taxonomy. Backed by real tooling rather than bespoke logic wherever it exists:
Lighthouse for performance, SEO, and best practices; axe-core for accessibility.

Every analyzer is testable against fixture pages with known defects. This is the
single most valuable test suite in the system — it is what prevents quality
regression as analyzers evolve, and it is ordinary unit testing with no AI
involved.

**Analyzers must never call a language model.** If an analyzer seems to need
one, the thing being attempted is interpretation and belongs one layer down.

### Interpreters

The first AI layer. Consume findings, produce recommendations with rationale.

- Input is the finding set, plus vertical-specific rubric context — never raw
  page content. Interpreters reason over structured evidence, not over HTML.
- Output conforms to a schema and cites the finding IDs it drew on.
- Prompts are versioned; the version is recorded on every recommendation.

Restricting the input to findings rather than page content is deliberate: a
model that cannot see the raw page cannot invent observations about it.

### Generators

Produce the artifacts a human eventually sends: the audit report, the homepage
redesign, the outreach draft.

- Consume recommendations, not findings and not raw pages
- Record model, prompt version, token counts, and cost on every artifact
- Never assert a fact that did not arrive through a recommendation

The redesign generator is the most expensive component in the system and the
last one worth building. The PRD's ordering — report first, redesign second —
exists so the evidence chain is proven end to end before the costly part is
attempted.

### Critics

The layer that turns the no-hallucination policy into an enforced property.

**Citation check (deterministic).** Parse the generated artifact for factual
claims and verify each resolves to a `Finding` ID. An artifact containing an
uncited claim is rejected automatically, before any human sees it. This is
ordinary software — string and reference checking, not model judgment — and it
is the most important quality control in the pipeline.

**Quality review (AI).** A second-pass model check for tone, generic phrasing,
and internal contradiction. Advisory, feeding the human review queue rather than
gating outright, because model judgment is not reliable enough to reject work
unsupervised.

The split matters: the mechanical check is trustworthy enough to auto-reject,
and the model check is not. Conflating them would either let hallucinations
through or discard good artifacts on a model's whim.

## Contracts

Every AI component declares:

- **A typed input schema and a typed output schema.** Zod is already a
  dependency and already used for route validation — the same discipline applies
  to model boundaries. A model response that fails its schema is a failure to be
  retried or surfaced, never data to be parsed leniently.
- **A versioned prompt**, stored in the repository and recorded by version on
  every artifact it produces. Prompt changes are code changes and go through the
  same review.
- **Cost instrumentation.** Model, token counts in and out, and computed dollar
  cost, attributed to a prospect. Populated from the first AI call — per-prospect
  cost cannot be reconstructed later, and it is the number that decides whether
  the business works.

## Why not one large agent

A single prompt handling discovery through outreach would be simpler to write
and worse in every way that matters: no layer could be tested in isolation,
failures would be untraceable, cost would be unattributable, and the evidence
chain would exist only as an instruction the model is asked to honor rather than
a structure it cannot violate.

The decomposition above is not agent-framework machinery. Each layer is a
function with typed inputs and outputs, called by the worker in sequence. **No
agent framework, orchestration library, or autonomous planning loop is used or
needed.** The pipeline's control flow is known in advance and belongs in
ordinary code — introducing a framework to express a fixed sequence would be
exactly the fashionable complexity the engineering principles reject.
