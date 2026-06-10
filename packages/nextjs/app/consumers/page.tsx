"use client";

import { useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatUnits, isAddress, isHex } from "viem";
import { ClientOnly } from "~~/components/ClientOnly";
import { useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { REGISTRY_ADDRESS, REGISTRY_FROM_BLOCK, shortHex } from "~~/utils/registry";

const SETTLEMENT_SCHEMA = `{
  "indexer": "0x...",        // indexer address
  "regId": "0x...",          // keccak256(indexer, target, eventSig)
  "queryCount": 100,          // number of queries in this batch
  "totalFeeUSDC": "1000000", // total fee in USDC (6 decimals)
  "consumerNonce": "...",     // unique nonce (replay protection)
  "consumer": "0x...",       // your address
  "expiry": "1234567890"     // unix timestamp (0 = no expiry)
}`;

const RegistrationRow = ({ regId, indexer, boost }: { regId: string; indexer: string; boost: bigint }) => {
  const { data: reputation } = useScaffoldReadContract({
    contractName: "IndexerRegistry",
    functionName: "reputationScore",
    args: [regId as `0x${string}`],
  });
  return (
    <tr>
      <td>
        <Address address={indexer as `0x${string}`} size="sm" />
      </td>
      <td>${Number(formatUnits(boost, 6)).toFixed(2)}</td>
      <td>{reputation !== undefined ? reputation.toString() : "…"}</td>
      <td className="font-mono text-xs">{shortHex(regId)}</td>
    </tr>
  );
};

const ConsumersInner = () => {
  const [target, setTarget] = useState("");
  const [eventSig, setEventSig] = useState("");
  const [query, setQuery] = useState<{ target: string; eventSig: string } | null>(null);

  const { data: events, isLoading } = useScaffoldEventHistory({
    contractName: "IndexerRegistry",
    eventName: "Registered",
    fromBlock: REGISTRY_FROM_BLOCK,
  });

  const matches = useMemo(() => {
    if (!query || !events) return [];
    return events.filter(
      e =>
        (e.args.target as string)?.toLowerCase() === query.target.toLowerCase() &&
        (e.args.eventSig as string)?.toLowerCase() === query.eventSig.toLowerCase(),
    );
  }, [events, query]);

  const handleSearch = () => {
    if (!isAddress(target) || !isHex(eventSig) || eventSig.length !== 66) return;
    setQuery({ target, eventSig });
  };

  return (
    <div className="flex flex-col grow w-full px-4 sm:px-8 py-8 max-w-3xl mx-auto gap-6">
      <h1 className="text-3xl font-bold">Consumer Guide</h1>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">How it works</h2>
          <ol className="list-decimal list-inside space-y-1 text-base-content/80">
            <li>Indexer stakes USDC (base stake) to join the registry.</li>
            <li>Indexer registers a (contract, event) pair with a USDC boost.</li>
            <li>Consumer queries the indexed data off-chain.</li>
            <li>Consumer signs an EIP-712 settlement receipt for the queries.</li>
            <li>Indexer submits the settlement on-chain to collect query fees.</li>
          </ol>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Settlement struct</h2>
          <pre className="bg-base-200 rounded-box p-4 text-xs overflow-x-auto">{SETTLEMENT_SCHEMA}</pre>
          <h3 className="font-semibold mt-2">EIP-712 domain</h3>
          <ul className="text-sm text-base-content/80 space-y-1">
            <li>
              <span className="font-mono">name</span>: IndexerRegistry
            </li>
            <li>
              <span className="font-mono">version</span>: 1
            </li>
            <li>
              <span className="font-mono">chainId</span>: 8453 (Base)
            </li>
            <li>
              <span className="font-mono">verifyingContract</span>:{" "}
              <span className="font-mono break-all">{REGISTRY_ADDRESS}</span>
            </li>
          </ul>
          <p className="text-xs text-base-content/60 mt-1">
            The primary type is <span className="font-mono">Settlement</span> with the fields above. Read the live
            domain on-chain via <span className="font-mono">eip712Domain()</span>.
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Find indexers for a pair</h2>
          <p className="text-base-content/70 text-sm">
            Enter a target contract and event signature hash to list indexers, sorted by reputation.
          </p>
          <label className="form-control w-full">
            <span className="label-text mb-1">Target contract</span>
            <input
              type="text"
              className="input input-bordered w-full font-mono"
              value={target}
              onChange={e => setTarget(e.target.value.trim())}
              placeholder="0x… contract address"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Event signature hash (bytes32)</span>
            <input
              type="text"
              className="input input-bordered w-full font-mono"
              value={eventSig}
              onChange={e => setEventSig(e.target.value.trim())}
              placeholder="0x… 32-byte hash"
            />
          </label>
          <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Search"}
          </button>

          {query && (
            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Indexer</th>
                    <th>Boost</th>
                    <th>Reputation</th>
                    <th>Reg ID</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-base-content/50">
                        No indexers found for this pair.
                      </td>
                    </tr>
                  )}
                  {matches.map((e, i) => (
                    <RegistrationRow
                      key={`${e.args.regId}-${i}`}
                      regId={e.args.regId as string}
                      indexer={e.args.indexer as string}
                      boost={(e.args.boost as bigint) ?? 0n}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Consumers: NextPage = () => (
  <ClientOnly>
    <ConsumersInner />
  </ClientOnly>
);

export default Consumers;
