// Self-contained fixture data for the landing's public read-only demo API.
// Deliberately does NOT import from the repo's backend (`src/*`): the landing is
// an isolated app, and reaching into `src/pulse/*` pulled in `.js`-suffixed
// imports the landing's bundler cannot resolve. The authoritative server-side
// API remains in the repository's typed core; this mirrors its safe public
// shape with clearly-labelled sample data.

const contractAddress = "0x0a14814aa3d4fd9c2e17090af23a655204993bff";

type Topic = {
  id: string;
  label: string;
  prevalence: number;
  momentum: number | null;
};

const topics: Topic[] = [
  { id: "formats-taking-off", label: "formats taking off", prevalence: 0.82, momentum: null },
  { id: "sounds-that-spread", label: "sounds that spread", prevalence: 0.74, momentum: null },
  { id: "watch-time-patterns", label: "watch-time patterns", prevalence: 0.61, momentum: null },
  { id: "engagement-signals", label: "engagement signals", prevalence: 0.57, momentum: null },
  { id: "whats-trending-now", label: "what's trending now", prevalence: 0.49, momentum: null },
];

const pulse = {
  mode: "fixture" as const,
  processedAt: "2026-10-13T00:00:00.000Z",
  topics,
  provenance: {
    source: "sample fixtures",
    note: "Clearly-labelled sample attention data, not verified live social trends.",
  },
};

// No registered-agent purchases exist yet, so agent demand and the gap are empty.
const agent = {
  mode: "fixture" as const,
  status: "insufficient-data",
  registeredAgents: 0,
  verifiedPurchases: 0,
  topics: [] as Topic[],
};
const gap = {
  status: "unavailable",
  note: "The attention gap needs verified registered-agent purchases before it can be computed.",
};

function response(body: unknown, status = 200): Response {
  return new Response(
    JSON.stringify(body, (_key, value: unknown) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
    {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

/** Public, fixture-only read adapter. It never sends transactions or invokes paid work. */
export function demoApi(request: Request): Response {
  const url = new URL(request.url);

  if (
    request.method === "POST" &&
    url.pathname === "/api/v1/intelligence/entitlements"
  ) {
    return response(
      {
        error: "Payment verification is not configured in the public demo",
        code: "PAYMENT_NOT_CONFIGURED",
      },
      503,
    );
  }

  if (request.method !== "GET") {
    return response({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  }
  if (url.pathname === "/api/v1/health") {
    return response({ status: "ok", version: "v1", mode: pulse.mode });
  }
  if (url.pathname === "/api/v1/status") {
    return response({
      status: "ok",
      chain: { id: 10143, network: "Monad Testnet", contractAddress },
      humanPulse: { mode: pulse.mode, dataStatus: pulse.mode },
      indexer: { status: "awaiting-cloud", graphqlUrl: null },
      payments: { status: "not-configured", livePurchasesEnabled: false },
    });
  }
  if (url.pathname === "/api/v1/human-pulse") return response(pulse);
  if (url.pathname === "/api/v1/topics") {
    return response({ topics: pulse.topics, provenance: pulse.provenance, mode: pulse.mode });
  }
  if (url.pathname === "/api/v1/agent-pulse") return response(agent);
  if (url.pathname === "/api/v1/attention-gap") return response(gap);
  if (url.pathname === "/api/v1/intelligence/catalog") {
    return response({
      products: pulse.topics.map((topic) => ({
        id: `human-pulse:${topic.id}`,
        topicId: topic.id,
        availability: "payment-not-yet-enabled",
        price: null,
      })),
    });
  }
  if (url.pathname === "/api/v1/manifest.json") {
    return response({
      name: "PULSE",
      version: "v1",
      description: "Safe public read-only attention intelligence API.",
      mode: pulse.mode,
      discovery: "/llms.txt",
      operations: [
        { method: "GET", path: "/api/v1/health", access: "public", output: "health status" },
        { method: "GET", path: "/api/v1/status", access: "public", output: "network, indexer, payment configuration" },
        { method: "GET", path: "/api/v1/topics", access: "public", output: "deterministic topic summaries and provenance" },
        { method: "GET", path: "/api/v1/human-pulse", access: "public", output: "human attention snapshot" },
        { method: "GET", path: "/api/v1/agent-pulse", access: "public", output: "attributable registered-agent demand only" },
        { method: "GET", path: "/api/v1/attention-gap", access: "public", output: "human versus agent comparison when evidence exists" },
        { method: "GET", path: "/api/v1/intelligence/catalog", access: "public", output: "catalog availability; no configured prices" },
      ],
      paidIntelligence: {
        enabled: false,
        note: "No public endpoint may spend funds or invoke paid inference.",
      },
    });
  }

  return response({ error: "Route not found", code: "NOT_FOUND" }, 404);
}
