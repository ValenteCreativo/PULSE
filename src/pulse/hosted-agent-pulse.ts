import { queryHostedPurchases } from "../indexer/hosted-client.js";
import { computeAgentPulse, type AgentPulse } from "./agent-pulse.js";

/** Fetches only indexed purchase events, then applies PULSE's explicit wallet-attribution rules locally. */
export async function computeHostedAgentPulse(endpoint: string, registeredAgentWallets: string[], fetcher: typeof fetch = fetch): Promise<AgentPulse> {
  return computeAgentPulse(await queryHostedPurchases(endpoint, fetcher), registeredAgentWallets);
}
