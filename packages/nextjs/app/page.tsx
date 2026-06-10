"use client";

import { useMemo } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { ClientOnly } from "~~/components/ClientOnly";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { REGISTRY_FROM_BLOCK, blockscoutAddress, shortHex } from "~~/utils/registry";
import { notification } from "~~/utils/scaffold-eth";

const usd = (value?: bigint) => `$${Number(formatUnits(value ?? 0n, 6)).toFixed(2)}`;

const DashboardInner = () => {
  const { address, isConnected } = useAccount();

  const { data: buybackReserve } = useScaffoldReadContract({
    contractName: "IndexerRegistry",
    functionName: "buybackReserveUSDC",
  });

  const { data: events, isLoading } = useScaffoldEventHistory({
    contractName: "IndexerRegistry",
    eventName: "Registered",
    fromBlock: REGISTRY_FROM_BLOCK,
    watch: true,
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "IndexerRegistry" });

  const registrations = useMemo(() => events ?? [], [events]);

  const myRegistrations = useMemo(() => {
    if (!address) return [];
    return registrations.filter(e => (e.args.indexer as string)?.toLowerCase() === address.toLowerCase());
  }, [registrations, address]);

  const handleDeregister = async (regId: string) => {
    try {
      await writeContractAsync({ functionName: "deregister", args: [regId as `0x${string}`] });
    } catch {
      notification.error("Deregister failed");
    }
  };

  return (
    <div className="flex flex-col grow w-full px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Event Indexer Registry</h1>
        <p className="text-base-content/70">
          Permissionless on-chain registry for event indexers — stake USDC, register (contract, event) pairs, earn query
          fees.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <span className="text-sm text-base-content/60">Total Registrations</span>
            <span className="text-2xl font-bold">{isLoading ? "…" : registrations.length}</span>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <span className="text-sm text-base-content/60">Total Boost Staked</span>
            <span className="text-2xl font-bold">
              {usd(registrations.reduce((acc, e) => acc + ((e.args.boost as bigint) ?? 0n), 0n))}
            </span>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-5">
            <span className="text-sm text-base-content/60">Buyback Reserve</span>
            <span className="text-2xl font-bold">{usd(buybackReserve)}</span>
          </div>
        </div>
        <div className="card bg-base-200 shadow-md">
          <div className="card-body p-5">
            <span className="text-sm text-base-content/60">Network</span>
            <span className="text-lg font-semibold">Base mainnet</span>
            <span className="text-xs text-base-content/50">Settle queries off-chain, slash via disputes.</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md mb-8">
        <div className="card-body">
          <h2 className="card-title">Recent Registrations</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Target</th>
                  <th>Event Sig</th>
                  <th>Boost</th>
                  <th>Indexer</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="text-center">
                      <span className="loading loading-spinner loading-sm" />
                    </td>
                  </tr>
                )}
                {!isLoading && registrations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50">
                      No registrations yet.
                    </td>
                  </tr>
                )}
                {registrations
                  .slice()
                  .reverse()
                  .map((e, i) => (
                    <tr key={`${e.args.regId}-${i}`}>
                      <td className="font-mono text-xs">{shortHex(e.args.regId as string)}</td>
                      <td>
                        <a
                          href={blockscoutAddress(e.args.target as string)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link font-mono text-xs"
                        >
                          {shortHex(e.args.target as string)}
                        </a>
                      </td>
                      <td className="font-mono text-xs">{shortHex(e.args.eventSig as string, 10, 6)}</td>
                      <td>{usd(e.args.boost as bigint)}</td>
                      <td>
                        <Address address={e.args.indexer as `0x${string}`} size="sm" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isConnected ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Your Registrations</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reg ID</th>
                    <th>Target</th>
                    <th>Event Sig</th>
                    <th>Boost</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {myRegistrations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-base-content/50">
                        You have no registrations.
                      </td>
                    </tr>
                  )}
                  {myRegistrations
                    .slice()
                    .reverse()
                    .map((e, i) => (
                      <tr key={`mine-${e.args.regId}-${i}`}>
                        <td className="font-mono text-xs">{shortHex(e.args.regId as string)}</td>
                        <td>
                          <a
                            href={blockscoutAddress(e.args.target as string)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link font-mono text-xs"
                          >
                            {shortHex(e.args.target as string)}
                          </a>
                        </td>
                        <td className="font-mono text-xs">{shortHex(e.args.eventSig as string, 10, 6)}</td>
                        <td>{usd(e.args.boost as bigint)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline btn-error"
                            disabled={isMining}
                            onClick={() => handleDeregister(e.args.regId as string)}
                          >
                            {isMining ? <span className="loading loading-spinner loading-sm" /> : "Deregister"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-200 shadow-md">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Connect your wallet</h2>
            <p className="text-base-content/70">Connect to view and manage your registrations.</p>
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: NextPage = () => (
  <ClientOnly>
    <DashboardInner />
  </ClientOnly>
);

export default Dashboard;
