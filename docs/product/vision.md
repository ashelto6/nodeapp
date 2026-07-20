# Corevia — Vision

> **What this document is.** The durable statement of what Corevia is, what it
> is deliberately not, and which assumptions it rests on. It holds strategy, not
> status — no roadmap progress, no open work. Those live in GitHub Milestones
> and Issues (see [ADR-0001](../adr/0001-project-state-workflow.md)).
>
> Product requirements live in [prd.md](prd.md); the entities that implement
> this thesis live in [domain-model.md](domain-model.md).

## The thesis

Businesses that are underperforming online almost never go looking for help.
They do not search for "website audit", "accessibility consulting", or
"conversion optimization" — a business owner with a bad website usually does not
know it is bad, and the ones who suspect it rarely know what to ask for.

Corevia inverts the direction of discovery. Instead of waiting to be found, it
finds businesses, analyzes them, and arrives with evidence already in hand:

> "We analyzed your site, found these specific problems, rebuilt your homepage
> to show what fixing them looks like, and here is what we would change and
> why."

The prospect experiences the value before any sale is discussed. That is the
competitive foundation.

## What Corevia actually is, stated honestly

**Today, Corevia is a machine that manufactures qualified, pre-warmed leads for
a service business.** The thing sold is website and marketing improvement work.
The automation is the go-to-market, not the product.

This framing is deliberate and it matters, because the alternative framing —
"autonomous business optimization platform" — invites engineering that the
business does not yet need. If Corevia is a platform, multi-tenancy, module
registries, and generalized agent infrastructure look like foundations. They are
not. They are cost, built before the one question that decides everything has an
answer.

Being a productized service first is not a lesser ambition. It is the ordering
that lets the platform be built later on evidence rather than hope.

**Delivery lives in a separate project.** Corevia acquires; a distinct project
does the actual website work (founder plus AI assistance, capped initially at
2–3 jobs per month). Keeping them separate is deliberate — they have different
lifecycles, different failure modes, and no reason to share a codebase. The
interface between them is a documented handoff, not an integration.

One consequence worth stating early: the delivery project should **run Corevia's
own analyzers against its own output before shipping**. A company whose pitch is
"your site has accessibility and performance problems" cannot ship sites with
accessibility and performance problems. The analyzers already exist by then, so
this costs almost nothing and converts an obvious credibility exposure into a
proof point.

**The platform thesis, when it arrives**, is the same machine sold as a
subscription: continuous monitoring rather than one-shot audits, with the
business itself as the customer rather than the target. The trigger for taking
that seriously is a book of engagement customers who ask, unprompted, for
ongoing monitoring after the initial project ends. Until then it is a direction,
not a plan.

## What Corevia is not

- **Not a web design agency in the conventional sense** — the differentiator is
  the acquisition machine, not the design work. If the machine were removed,
  what remains is an ordinary agency competing on portfolio and price.
- **Not an AI agency.** AI is a component, not the pitch. Nothing in the
  positioning should lead with it.
- **Not generic SaaS.** There is no self-serve signup, no free tier, no product
  a stranger uses without a conversation.
- **Not a chatbot or a report generator.** The output is a specific,
  evidence-backed argument about one business, not a template with the name
  substituted in.

## The core assumption, and its counter-argument

Everything rests on one claim:

> Businesses that receive unsolicited, evidence-backed, personalized improvement
> demonstrations convert at a rate that justifies the cost of producing them.

**The strongest argument against it:** low search volume for "website audit" can
be read two ways. Corevia reads it as an underserved market. It can equally be
read as *absence of demand* — people do not search for it because they do not
want it. A business owner whose website is bad may have a bad website precisely
because they do not care about their website. The real competitor is not another
agency; it is indifference.

**The second argument against it:** the "wow" of a generated redesign may not
survive contact with reality. An owner who sees an unsolicited redesign may read
it as presumptuous rather than impressive.

Neither objection is fatal, and neither can be resolved by reasoning. Both are
answered by sending real emails to real businesses and counting replies. That
measurement is a gate in the roadmap, not an afterthought — see
[prd.md](prd.md#the-validation-gate).

## Strategic risks, named

Ordered by how likely each is to end the company.

1. **Conversion is simply too low.** Mitigated only by measuring it early and
   cheaply, before the expensive pipeline exists.
2. **Deliverability.** Cold outreach from a new domain lands in spam by default.
   If the mail does not arrive, artifact quality is irrelevant. This is treated
   as a first-class subsystem, not a configuration detail.
3. **Legal exposure.** Scraped contact data is personal data under GDPR in most
   real cases; discovery-source terms of service constrain what may be stored at
   all. These shape the schema, not just the policy page.
4. **Unit economics invert.** Generating full artifacts for every discovered
   business can cost more than the resulting customers are worth. Addressed
   architecturally by the two-stage funnel.
5. **Quality plateau.** Generated recommendations that read as generic destroy
   the entire premise. Addressed by enforced evidence provenance and by
   narrowing to a single vertical where domain knowledge can be made explicit.

## Focus as a strategy, not a limitation

Corevia targets **one vertical in one metropolitan area** to start. Generality
is actively harmful here: a dentist's homepage, a plumber's, and a law firm's
have different trust signals, different customer urgency, and different
conversion patterns. A system built to analyze all of them produces
recommendations general enough to fit all of them — which is exactly the generic
output the product philosophy forbids.

Narrowing makes the analysis rubric explicit and writable, makes generated copy
dramatically better (real examples from the same industry as few-shot context),
and makes outreach credible in a way no general system can match: "we have
looked at forty dental practices in this city" is a sentence that only a focused
system earns.

**Trigger for generalizing:** when a second vertical's rubric can be written
down in full from real experience, not imagined in advance.

The first vertical and metro are chosen: **emergency home services
(plumbing-first) in Sacramento**, with expansion to more metros on the same
rubric rather than more verticals. The reasoning and the expansion path are in
[ADR-0007](../adr/0007-vertical-metro-and-hero-artifact.md).

## Long-term direction

Website analysis is the first module, not the product. Plausible later modules —
SEO, accessibility, Google Business Profile, reputation and review analysis,
competitor monitoring, local search, continuous monitoring — share a shape:
collect evidence about a business, detect findings, interpret them, recommend
action.

That shared shape is why the architecture defines Collector / Analyzer /
Finding as general contracts rather than website-specific ones (see
[agent-architecture.md](agent-architecture.md)). **This is the only place where
building for future modules is justified**, because it costs almost nothing: a
`Finding` that carries a module identifier is not more work than one that does
not. Everything beyond that contract — module registries, plugin loading,
per-module configuration UI — is deferred until a second module actually exists
and its real requirements are known.

**One qualification, from the vertical choice.** For emergency home services the
most persuasive evidence is not on the website at all — it is the review gap
versus competitors, Google Business Profile completeness, and local-search
position (see [ADR-0007](../adr/0007-vertical-metro-and-hero-artifact.md)). So
the MVP pulls a *subset of those signals* forward into screening and outreach
evidence, even though Reputation, Review, GBP, and Local-Search remain future
*modules*. The distinction is deliberate: capturing a handful of scrapeable data
points that share the existing `Finding` taxonomy is cheap; building the modules
around them is not, and waits for its trigger like everything else here.
