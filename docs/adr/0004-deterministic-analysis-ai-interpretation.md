# 4. Deterministic engines detect; AI interprets and generates

- Status: accepted
- Date: 2026-07-20
- Issue: n/a (product architecture session)

## Context

An early decomposition of Corevia's AI components listed workers including
Business Discovery, Website Analysis, UX Evaluation, Accessibility Review, SEO
Analysis, Homepage Design, Report Generation, Copywriting, Outreach Generation,
and Quality Assurance.

Several of those are solved deterministic problems. Accessibility conformance is
what axe-core and Pa11y do — a WCAG rule engine returns exact violations with
DOM selectors and measured contrast ratios. Performance and Core Web Vitals are
what Lighthouse does, with real numbers. SEO structure is a checklist: title,
meta description, heading hierarchy, canonical, `robots.txt`, sitemap,
structured data, alt coverage. Discovery is an API call.

Asking a language model to perform these returns plausible answers, some
invented. That directly contradicts the product's own stated philosophy — *AI
should augment deterministic analysis, not replace it* — and it undermines the
differentiator, since fabricated findings in an unsolicited email are
unrecoverable.

## Decision

Split by whether the work is *measurement* or *judgment*.

**Deterministic — never an LLM:**

- Collectors: fetching, rendering, screenshotting, crawling, business data APIs
- Analyzers: Lighthouse, axe-core, SEO structural rules, conversion-element
  checks, technology fingerprinting
- The citation check (see
  [ADR-0003](0003-evidence-provenance-chain.md))

**AI — where judgment creates value:**

- Interpreters: findings → prioritized, business-contextual recommendations
- Generators: audit report, homepage redesign, outreach copy
- Advisory quality review (tone, generic phrasing, contradiction)

Analyzers must never call a language model. An analyzer that appears to need one
is attempting interpretation and belongs in the layer below.

Interpreters consume findings and vertical rubric context, never raw page
content.

## Alternatives considered

**LLM-based analysis with tool access.** Give a model the page and a browser and
let it evaluate. Rejected: non-reproducible, unauditable, expensive per prospect,
and it produces findings that cannot be traced to a measurement.

**LLM verification of deterministic findings.** Run both and have the model
confirm. Rejected as redundant — the rule engine's output is already ground
truth, and a model second-guessing it introduces false negatives with no upside.

**Fully deterministic, including recommendations.** Template-driven advice keyed
to finding codes. Rejected: this produces exactly the generic output the product
philosophy forbids, and the contextual explanation is where the perceived value
lives. Worth noting as the fallback if AI-generated interpretation proves
unreliable or uneconomic.

## Consequences

- Findings are reproducible, auditable, and cheap. The screening stage runs at
  near-zero marginal cost, which is what makes
  [ADR-0002](0002-two-stage-screening-generation-funnel.md)'s funnel viable.
- Analyzer correctness is testable with ordinary unit tests against fixture
  pages with known defects. This becomes the most valuable test suite in the
  system and requires no AI-specific testing infrastructure.
- The AI surface area is small and well-bounded, which limits both cost and the
  blast radius of model or prompt regressions.
- Cost: more integration work up front (Lighthouse and axe-core in a rendering
  environment) than pointing a model at a URL. Accepted — that integration is
  one-time and the resulting findings are permanently trustworthy.
- Dependency on external tooling versions becomes a real concern: an axe-core or
  Lighthouse upgrade can change findings for the same page. Handled by recording
  collector and analyzer versions on every `AnalysisRun`.
