// Generic API transport: one place for JSON parsing and error handling,
// so components never call fetch() directly. Each feature gets its own
// thin module next to this one (see health.api.js) built on request().
async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // The server's error middleware always returns { error: "..." } —
  // surface that message rather than a generic failure when present.
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the status-based message.
    }
    throw new Error(message);
  }

  return res.json();
}

export { request };
