import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Common, Hardfork, Mainnet } from "@ethereumjs/common";
import { createLegacyTx } from "@ethereumjs/tx";
import { createAccount, createAddressFromPrivateKey, createContractAddress, hexToBytes } from "@ethereumjs/util";
import { createVM, runTx } from "@ethereumjs/vm";
import { encodeFunctionData, keccak256, toHex } from "viem";
import { compilePulseMarket } from "../src/contract/compile.js";

const ownerKey = hexToBytes(`0x${"11".repeat(32)}`);
const buyerKey = hexToBytes(`0x${"22".repeat(32)}`);
const productId = keccak256(toHex("human-pulse:ai"));
const topicId = keccak256(toHex("ai"));
const purchaseId = keccak256(toHex("purchase-1"));

describe("PulseIntelligenceMarket", () => {
  it("compiles and locally enforces exact amount plus one-time redemption", async () => {
    const compiled = await compilePulseMarket();
    const abi = compiled.abi as Parameters<typeof encodeFunctionData>[0]["abi"];
    assert.ok(compiled.bytecode.length > 100);
    const common = new Common({ chain: Mainnet, hardfork: Hardfork.Prague });
    const vm = await createVM({ common });
    const owner = createAddressFromPrivateKey(ownerKey);
    const buyer = createAddressFromPrivateKey(buyerKey);
    await vm.stateManager.putAccount(owner, createAccount({ nonce: 0n, balance: 10n ** 18n }));
    await vm.stateManager.putAccount(buyer, createAccount({ nonce: 0n, balance: 10n ** 18n }));
    const deployment = createLegacyTx({ nonce: 0n, gasLimit: 3_000_000n, gasPrice: 10n, data: compiled.bytecode }, { common }).sign(ownerKey);
    const deployed = await runTx(vm, { tx: deployment });
    assert.equal(deployed.execResult.exceptionError, undefined);
    const address = createContractAddress(owner, 0n);
    const call = async (privateKey: Uint8Array, nonce: bigint, data: `0x${string}`, value = 0n) => runTx(vm, {
      tx: createLegacyTx({ nonce, to: address, gasLimit: 500_000n, gasPrice: 10n, data, value }, { common }).sign(privateKey),
    });
    const configure = encodeFunctionData({ abi, functionName: "configureProduct", args: [productId, 100n, true] });
    assert.equal((await call(ownerKey, 1n, configure)).execResult.exceptionError, undefined);
    const purchase = encodeFunctionData({ abi, functionName: "purchase", args: [productId, topicId, purchaseId] });
    assert.notEqual((await call(buyerKey, 0n, purchase, 99n)).execResult.exceptionError, undefined);
    const completed = await call(buyerKey, 1n, purchase, 100n);
    assert.equal(completed.execResult.exceptionError, undefined);
    assert.equal(completed.receipt.logs.length, 1);
    assert.notEqual((await call(buyerKey, 2n, purchase, 100n)).execResult.exceptionError, undefined);
  });
});
