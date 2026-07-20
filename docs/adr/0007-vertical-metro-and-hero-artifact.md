# 7. Vertical, metro, and the Module One hero artifact

- Status: accepted
- Date: 2026-07-20
- Issue: #179

## Context

The vision and PRD committed to focusing on one vertical in one metro but left
both unchosen. Selecting them surfaced a deeper question about what Corevia's
first deliverable actually is.

The reasoning ran through several steps, each of which changed the conclusion:

1. **Search ranking is biased against the target.** A manual check of Sacramento
   plumbers showed the top results are Local Services Ads and heavily-optimized
   profiles — businesses that have *already* solved digital acquisition and need
   Corevia least. The real targets are several pages deep. (Recorded on #139.)
2. **Two kinds of indifference.** Home-services owners are mostly indifferent to
   their *website* — which is fine, the product translates that into "you're
   losing calls." But some are indifferent to *growth itself* (booked-solid,
   near-retirement), and those are unqualifiable regardless of evidence. This
   produced the growth-intent scoring axis on #147.
3. **The strongest evidence in this vertical is not the website.** Review gap
   versus competitors, Google Business Profile completeness, and local-search
   position are more persuasive, more revenue-legible, and — crucially — *harder
   facts* than an aesthetic redesign. "You have 14 reviews, the plumber ranking
   above you has 340" is not arguable; "your site looks dated" is.
4. **This raised the obvious question: is a website-redesign vertical a better
   fit?** It is not, and understanding why is the core of this decision.

**The inverse correlation.** For local service businesses, "the website is the
decisive conversion surface" and "good cold-outreach target" are inversely
correlated. A website is the hero only when the customer spends time on it while
deciding — considered, aesthetic, longer-cycle purchases (dental, med spa,
cosmetic, law, wedding venues, custom builders). Those are precisely the
saturated, slow-sales-cycle verticals that cold outreach serves *worst*. Urgent
trades (plumbing, HVAC, electrical) convert on cold outreach — fast, one
decision-maker, low agency saturation — but there the website is not the hero.

Chasing "website is the hero" therefore walks toward saturation and long sales
cycles, not away from them. This is the same structure as the earlier
"cares about digital presence ↔ agency saturation" tradeoff; it is one
underlying fact showing up twice.

## Decision

**Vertical:** emergency home services — plumbing, HVAC, and electrical, treated
as a single rubric (they share ~85%: emergency-driven, mobile-first,
click-to-call critical, service-area based, licensing/insurance trust signals).
**Plumbing-first**, because plumbing demand is flat year-round while Sacramento
HVAC peaks in summer — and a contractor buried in July emergency calls does not
read cold email. Treating the three as one vertical roughly triples the
addressable pool (~500–700 qualified prospects) without diluting the rubric.

**Metro:** Sacramento (the founder's own metro). In-person capability is a
genuine close advantage on a $2–5k sale that anonymous competitors cannot match.
Expansion, when Sacramento's pool thins, is to **more metros on the same
rubric** — the Central Valley corridor (Stockton → Modesto → Fresno), possibly
Reno — not to more verticals. The rubric is the reusable asset; the metro is
disposable.

**Module One hero artifact: deferred to empirical validation.** The homepage
redesign is *not* committed as the hero. The MVP's argument leads with a
**local-dominance audit** — review gap, GBP completeness, local-search position,
and conversion mechanics — with the redesign demoted to *proof of capability*
rather than the pitch itself. The final decision on which framing leads is made
by **#149**, which sends real outreach in both framings and lets reply rate
settle it. The company's differentiator — evidence-based cold outreach that
demonstrates value before the sale — is unchanged; only the assumed first
expression of it flexes.

## Alternatives considered

**Switch to a vertical where the website is genuinely the hero** (dental, med
spa, cosmetic, wedding venues). Rejected: every such vertical trades plumbing's
one weakness (redesign is not the lead) for a worse one — agency saturation,
long emotional sales cycles, low per-metro volume, or owners who already care
and are already pitched. The exception hunt (venues, funeral homes, custom
remodelers) found no vertical that is both website-hero *and* a strong
cold-outreach target.

**Commit the redesign as hero now.** Rejected as premature and expensive: it is
the costliest component to build (#156), it quietly fights the "sell more calls,
not a better website" positioning, and the question is cheaply answerable with
data via #149. Deciding it by argument now would be guessing where measuring is
available.

**Stay multi-vertical / multi-metro.** Already rejected in the vision for
producing generic output; restated here because a broad discovery source makes
this the path of least resistance unless explicitly resisted.

## Consequences

- **Screening must gather local-presence evidence**, not just on-site findings.
  The opportunity axis of #147 gains review gap, GBP completeness, and
  local-search position, and a new collector/analyzer issue provides that data.
  Without it, the scorer measures the wrong thing for this vertical.
- **#149 becomes a two-arm test**, not a single-framing send. It must capture
  which framing (local-dominance-led vs redesign-led) earned replies, because it
  now resolves the hero-artifact question in addition to the reply-rate gate.
- **The redesign (#156) is de-risked** from "the company's bet" to "a demo."
  Its cost matters less; #176's dual-purpose (sales asset + build spec) matters
  more.
- **A subset of future modules is pulled forward as *signals*, not modules.**
  Reputation/Review/GBP/Local-Search remain future *modules* in the vision;
  the MVP captures a few of their data points for screening and outreach
  evidence. This is the only pull-forward, and it is cheap because the data is
  scrapeable and the findings share the existing taxonomy.
- **Seasonality is now a planned input.** Sacramento plumbing is flat; HVAC
  peaks May–September; the receptive outreach window is shoulder season
  (roughly February–April), which is where the Phase 6 validation timeline
  plausibly lands. Recorded on #151.
- **The local-presence data depends on the discovery-source decision (#132).**
  Review counts and GBP fields most likely come from the same source, whose
  terms constrain what may be stored — so this pull-forward inherits #132's
  legal analysis rather than being independent of it.
