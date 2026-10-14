export function GET(): Response {
  return new Response(
    "# PULSE\n\nPULSE is an Attention Intelligence Network.\n\nPublic API: /api/v1/health, /api/v1/status, /api/v1/topics, /api/v1/human-pulse, /api/v1/agent-pulse, /api/v1/attention-gap, /api/v1/intelligence/catalog.\n\nThe Human Pulse public feed is currently deterministic fixture data, not live social attention. Agent Pulse and Attention Gap must remain unavailable or insufficient-data until real attributable indexed activity exists. Paid intelligence is not configured.\n\nMachine manifest: /api/v1/manifest.json\nNetwork: Monad Testnet (chain 10143). Contract: 0x0a14814aa3d4fd9c2e17090af23a655204993bff.\n",
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
