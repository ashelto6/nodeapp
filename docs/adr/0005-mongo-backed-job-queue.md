# 5. Back the pipeline job queue with MongoDB; defer a dedicated queue

- Status: accepted
- Date: 2026-07-20
- Issue: n/a (product architecture session)

## Context

The analysis pipeline is asynchronous and long-running. Screening a prospect
involves network fetches, page rendering, and several analyzers; generation
involves multiple LLM calls. None of this belongs in an HTTP request cycle, so
work must be queued and executed by a worker.

The reflexive answer is Redis with BullMQ, or a durable workflow engine like
Temporal. Both are real infrastructure: another service to run, monitor, back
up, and secure on a single Linode box that currently runs nginx, Express, and
MongoDB together.

Actual near-term scale is modest. One vertical in one metro plausibly means
hundreds to low thousands of prospects, processed by a single operator, with no
latency requirement beyond "finishes overnight."

## Decision

Implement the queue as a MongoDB collection with lease-based claiming.

- A `jobs` collection with `type`, `payload`, `status`, `attempts`,
  `leaseExpiresAt`, `availableAt`
- Workers claim jobs via `findOneAndUpdate` with a status-and-lease filter,
  which is atomic in MongoDB and sufficient to prevent double-claiming
- Failed jobs increment `attempts` and set `availableAt` for backoff
- Expired leases return jobs to the pool, so a crashed worker's jobs recover

A single worker process runs initially. It is a separate process from the API,
built from the same image with a different entrypoint — not a separate service
or repository.

**Named trigger to replace this:** when any of the following becomes genuinely
painful rather than theoretically imperfect —

- Concurrency control beyond a simple per-worker limit
- Job dependency graphs or multi-step workflows needing durable state between
  steps
- Scheduled and recurring jobs at a volume that makes polling wasteful
- Queue depth or claim contention showing up in monitoring

At that point BullMQ (if the need is throughput and concurrency) or Temporal (if
the need is durable multi-step workflow state) earns its place. Not before.

## Alternatives considered

**Redis + BullMQ now.** Mature, good concurrency primitives, good tooling.
Rejected for now: a whole additional stateful service, with its own persistence
and backup story, to solve a problem the existing database can handle at this
scale. It is a small, well-understood migration when the trigger fires.

**Temporal or similar durable workflow engine.** Genuinely well-matched to
multi-step pipelines with retries. Rejected as substantial operational
complexity — it is the right answer for a pipeline whose failure modes are
understood, and those are not yet known.

**Synchronous processing in the API.** Rejected: page rendering and LLM calls
would block the request cycle, destabilize the health endpoint that the deploy
gate depends on, and make retries impossible.

**Cron-driven batch scripts.** Simplest possible. Rejected: no retry semantics,
no visibility into in-flight work, and no way to prioritize.

## Consequences

- Zero new infrastructure. The queue inherits MongoDB's existing backup,
  monitoring, and access-control story rather than needing its own.
- Job state is queryable with the same tools as everything else, and job history
  is naturally durable — useful for debugging pipeline failures.
- Cost: polling for available jobs is less efficient than a push-based queue.
  Irrelevant at this scale; a poll interval measured in seconds is fine.
- Cost: no mature dashboard, rate limiting, or priority handling out of the box.
  Accepted; these are exactly the needs that would fire the replacement trigger.
- The lease-expiry mechanism must be correct or jobs can be processed twice.
  This is the main implementation risk and warrants focused tests, particularly
  around a worker that dies mid-job.
