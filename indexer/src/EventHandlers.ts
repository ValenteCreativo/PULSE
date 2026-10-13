import { indexer } from "generated";

/** Duplicate-safe primary key means Envio's replays/reorg handling cannot double-count a log. */
indexer.onEvent(
  { contract: "PulseIntelligenceMarket", event: "IntelligencePurchased" },
  async ({ event, context }) => {
    const id = `${event.chainId}-${event.transaction.hash}-${event.logIndex}`;
    context.Purchase.set({
      id,
      buyer: event.params.buyer.toLowerCase(),
      topicId: event.params.topicId,
      productId: event.params.productId,
      amount: event.params.amount,
      purchaseId: event.params.purchaseId,
      transactionHash: event.transaction.hash,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    });
    const demand = await context.TopicDemand.get(event.params.topicId);
    context.TopicDemand.set({
      id: event.params.topicId,
      purchases: (demand?.purchases ?? 0n) + 1n,
      totalAmount: (demand?.totalAmount ?? 0n) + event.params.amount,
      lastPurchaseTimestamp: event.block.timestamp,
    });
  },
);
