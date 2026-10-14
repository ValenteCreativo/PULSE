"use client";

import { formatEther } from "viem";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
type Product = { id: string; productId: string; topicId: string; priceWei: string; active: boolean; contractAddress: string; chainId: number };
type Prepared = Product & { purchaseId: string; data: string; value: string };
type State = "loading" | "ready" | "connecting" | "wallet" | "submitted" | "confirmed" | "error";
const CHAIN_HEX = "0x279f";
const explorer = (hash: string) => `https://testnet.monadvision.com/tx/${hash}`;
const provider = () => (window as Window & { ethereum?: Provider }).ethereum ?? null;

export function PurchaseDemoClient() {
  const [product, setProduct] = useState<Product | null>(null); const [state, setState] = useState<State>("loading");
  const [detail, setDetail] = useState("Reading the active human-pulse:ai product from Monad Testnet…"); const [wallet, setWallet] = useState<string | null>(null); const [hash, setHash] = useState<string | null>(null);
  useEffect(() => { void apiFetch<Product>("/api/purchase-demo/product").then((value) => { setProduct(value); setState("ready"); setDetail("Live product loaded from the deployed contract."); }).catch((error: unknown) => { setState("error"); setDetail(error instanceof Error ? error.message : "Could not load the product."); }); }, []);
  const purchase = async () => {
    try {
      const ethereum = provider(); if (!ethereum) throw new Error("MetaMask was not detected. Install or unlock it, then reload.");
      setState("connecting"); setDetail("Requesting account access in MetaMask…");
      const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[]; const from = accounts[0]; if (!from) throw new Error("MetaMask did not return an account.");
      try { await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] }); } catch (error) {
        if ((error as { code?: number }).code !== 4902) throw error;
        await ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: CHAIN_HEX, chainName: "Monad Testnet", nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 }, rpcUrls: ["https://testnet-rpc.monad.xyz"], blockExplorerUrls: ["https://testnet.monadvision.com"] }] });
      }
      if (await ethereum.request({ method: "eth_chainId" }) !== CHAIN_HEX) throw new Error("MetaMask is not connected to Monad Testnet (chain 10143).");
      setWallet(from); const prepared = await apiFetch<Prepared>("/api/purchase-demo/prepare", { method: "POST" });
      setState("wallet"); setDetail("Review the contract call and price in MetaMask. Nothing is sent until you confirm there.");
      const transactionHash = await ethereum.request({ method: "eth_sendTransaction", params: [{ from, to: prepared.contractAddress, value: prepared.value, data: prepared.data }] }) as string;
      setHash(transactionHash); setState("submitted"); setDetail("Transaction submitted. Waiting for its Monad receipt…");
      for (let attempt = 0; attempt < 40; attempt += 1) { const result = await apiFetch<{ state: "pending" | "reverted" | "missing-event" | "confirmed" }>("/api/purchase-demo/verify", { method: "POST", body: JSON.stringify({ hash: transactionHash, buyer: from, purchaseId: prepared.purchaseId }) }); if (result.state === "confirmed") { setState("confirmed"); setDetail("Confirmed receipt contains IntelligencePurchased."); return; } if (result.state !== "pending") throw new Error(result.state === "reverted" ? "The transaction reverted." : "The receipt did not contain the expected IntelligencePurchased event."); await new Promise((resolve) => window.setTimeout(resolve, 1500)); }
      throw new Error("Transaction was submitted, but a receipt is not available yet. Check MonadVision shortly.");
    } catch (error) { setState("error"); setDetail(error instanceof Error ? error.message : "The wallet request was not completed."); }
  };
  const canPurchase = state === "ready" || (state === "error" && product?.active);
  return <section className="grid gap-4" aria-live="polite">
    <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-xl border border-nav-surface bg-nav-surface/30 p-6"><p className="mb-3 text-[0.75rem] tracking-[0.14em] text-nav-accent uppercase">Product</p><h2 className="text-[1.75rem] font-semibold text-nav-text">human-pulse:ai</h2><code className="block overflow-auto text-[0.6875rem] text-hud-text/65">{product?.productId ?? "Reading contract…"}</code></article><article className="rounded-xl border border-nav-surface bg-nav-surface/30 p-6"><p className="mb-3 text-[0.75rem] tracking-[0.14em] text-nav-accent uppercase">Live onchain price</p><h2 className="text-[1.75rem] font-semibold text-nav-text">{product ? `${formatEther(BigInt(product.priceWei))} MON` : "Loading…"}</h2><code className="text-[0.6875rem] text-hud-text/65">{product ? `${product.priceWei} wei · active` : "Monad Testnet eth_call"}</code></article></div>
    <article className="rounded-xl border border-nav-surface bg-nav-surface/30 p-6"><p className="mb-2 text-[0.75rem] tracking-[0.14em] text-nav-accent uppercase">{state.replaceAll("-", " ")}</p><p className="text-hud-text/80">{detail}</p>{wallet ? <small className="mt-3 block font-sans text-[0.75rem] text-hud-text/65">Connected wallet: {wallet}</small> : null}<button type="button" onClick={() => void purchase()} disabled={!canPurchase} className="mt-6 rounded-md bg-nav-accent px-5 py-3 text-[0.875rem] font-semibold text-nav-accent-ink transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">{state === "wallet" ? "Awaiting MetaMask confirmation…" : "Connect MetaMask & prepare purchase"}</button><small className="mt-4 block font-sans text-[0.75rem] text-hud-text/65">Contract call: purchase(productId, topicId, purchaseId). MetaMask must approve every transaction.</small></article>
    {hash ? <article className="rounded-xl border border-nav-accent/40 bg-nav-surface/30 p-6"><p className="mb-2 text-[0.75rem] tracking-[0.14em] text-nav-accent uppercase">Transaction</p><code className="block overflow-auto text-[0.75rem] text-hud-text">{hash}</code><a href={explorer(hash)} target="_blank" rel="noreferrer" className="mt-4 inline-block border-b border-nav-accent text-[0.8125rem] text-nav-accent">Open in MonadVision ↗</a>{state === "confirmed" ? <strong className="mt-4 block text-[0.8125rem] text-nav-accent">✓ IntelligencePurchased verified in receipt</strong> : null}</article> : null}
  </section>;
}
