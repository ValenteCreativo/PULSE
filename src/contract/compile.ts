import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import solc from "solc";

export type CompiledMarket = { abi: readonly unknown[]; bytecode: `0x${string}`; deployedBytecode: `0x${string}`; immutableReferences: Record<string, Array<{ start: number; length: number }>> };

export async function compilePulseMarket(): Promise<CompiledMarket> {
  const source = await readFile(resolve(process.cwd(), "contracts/PulseIntelligenceMarket.sol"), "utf8");
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { "PulseIntelligenceMarket.sol": { content: source } },
    settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences"] } } },
  }))) as { errors?: Array<{ severity: string; formattedMessage: string }>; contracts?: Record<string, Record<string, { abi: unknown[]; evm: { bytecode: { object: string }; deployedBytecode: { object: string; immutableReferences?: Record<string, Array<{ start: number; length: number }>> } } }>> };
  const errors = output.errors?.filter((error) => error.severity === "error") ?? [];
  if (errors.length > 0) throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  const contract = output.contracts?.["PulseIntelligenceMarket.sol"]?.PulseIntelligenceMarket;
  if (!contract?.evm.bytecode.object || !contract.evm.deployedBytecode.object) throw new Error("PulseIntelligenceMarket compilation produced no bytecode");
  return { abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}`, deployedBytecode: `0x${contract.evm.deployedBytecode.object}`, immutableReferences: contract.evm.deployedBytecode.immutableReferences ?? {} };
}
