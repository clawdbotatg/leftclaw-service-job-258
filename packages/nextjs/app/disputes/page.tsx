"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatUnits, isHex } from "viem";
import { base } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ClientOnly } from "~~/components/ClientOnly";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { REGISTRY_ADDRESS, REGISTRY_FROM_BLOCK, shortHex } from "~~/utils/registry";
import { notification } from "~~/utils/scaffold-eth";

const DISPUTE_WINDOW_SECS = 86_400n; // 24h
const RESOLUTION_BUFFER = 300n; // 5min
const DISPUTE_STATE_LABELS = ["Pending", "Commit Received", "Resolved (Disputer)", "Resolved (Indexer)", "Expired"];

const usd = (value?: bigint) => `$${Number(formatUnits(value ?? 0n, 6)).toFixed(2)}`;

const DisputeRow = ({ disputeId, regId, isIndexer }: { disputeId: string; regId: string; isIndexer: boolean }) => {
  const { data: dispute } = useScaffoldReadContract({
    contractName: "IndexerRegistry",
    functionName: "disputes",
    args: [disputeId as `0x${string}`],
  });
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "IndexerRegistry" });
  const [proofHash, setProofHash] = useState("");
  const [nowSecs, setNowSecs] = useState(() => BigInt(Math.floor(Date.now() / 1000)));

  useEffect(() => {
    const id = setInterval(() => setNowSecs(BigInt(Math.floor(Date.now() / 1000))), 10_000);
    return () => clearInterval(id);
  }, []);

  if (!dispute) {
    return (
      <tr>
        <td colSpan={5} className="text-center">
          <span className="loading loading-spinner loading-sm" />
        </td>
      </tr>
    );
  }

  const openedAt = dispute[5] as bigint;
  const state = Number(dispute[8]);
  const now = nowSecs;
  const expiryDeadline = openedAt + DISPUTE_WINDOW_SECS + RESOLUTION_BUFFER;
  const responseDeadline = openedAt + 21_600n; // DISPUTE_RESPONSE_SECS = 6h
  const canResolveExpired = (state === 0 || state === 1) && now >= expiryDeadline;
  const canCommit = isIndexer && state === 0 && now <= responseDeadline;

  const handleCommit = async () => {
    if (!isHex(proofHash) || proofHash.length !== 66) {
      notification.error("Proof hash must be 32-byte hex");
      return;
    }
    try {
      await writeContractAsync({
        functionName: "commitResponse",
        args: [disputeId as `0x${string}`, proofHash as `0x${string}`],
      });
    } catch {
      notification.error("Commit failed");
    }
  };

  const handleResolveExpired = async () => {
    try {
      await writeContractAsync({ functionName: "resolveExpiredDispute", args: [disputeId as `0x${string}`] });
    } catch {
      notification.error("Resolve failed");
    }
  };

  return (
    <tr>
      <td className="font-mono text-xs">{shortHex(disputeId)}</td>
      <td className="font-mono text-xs">{shortHex(regId)}</td>
      <td>
        <span className="badge badge-outline">{DISPUTE_STATE_LABELS[state] ?? state}</span>
      </td>
      <td className="text-xs">
        opened {new Date(Number(openedAt) * 1000).toLocaleString()}
        <br />
        expiry {new Date(Number(expiryDeadline) * 1000).toLocaleString()}
      </td>
      <td className="flex flex-col gap-1">
        {canCommit && (
          <div className="flex flex-col gap-1">
            <input
              type="text"
              className="input input-bordered input-sm font-mono"
              placeholder="0x proof hash"
              value={proofHash}
              onChange={e => setProofHash(e.target.value.trim())}
            />
            <button className="btn btn-sm btn-primary" disabled={isMining} onClick={handleCommit}>
              {isMining ? <span className="loading loading-spinner loading-sm" /> : "Commit Response"}
            </button>
          </div>
        )}
        {canResolveExpired && (
          <button className="btn btn-sm btn-warning" disabled={isMining} onClick={handleResolveExpired}>
            {isMining ? <span className="loading loading-spinner loading-sm" /> : "Resolve Expired"}
          </button>
        )}
        {!canCommit && !canResolveExpired && <span className="text-xs text-base-content/50">No action</span>}
      </td>
    </tr>
  );
};

const DisputesInner = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  const [regId, setRegId] = useState("");
  const [claimHash, setClaimHash] = useState("");
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalCooldown, setApprovalCooldown] = useState(false);

  const { data: registration } = useScaffoldReadContract({
    contractName: "IndexerRegistry",
    functionName: "registrations",
    args: [isHex(regId) && regId.length === 66 ? (regId as `0x${string}`) : undefined],
  });

  const { data: disputerRecord } = useScaffoldReadContract({
    contractName: "IndexerRegistry",
    functionName: "disputerRecords",
    args: [address],
  });

  const { data: allowance, refetch: refetchAllowance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "allowance",
    args: [address, REGISTRY_ADDRESS],
  });

  const { data: disputeEvents } = useScaffoldEventHistory({
    contractName: "IndexerRegistry",
    eventName: "DisputeOpened",
    fromBlock: REGISTRY_FROM_BLOCK,
    watch: true,
  });

  const { writeContractAsync: usdcWrite } = useScaffoldWriteContract({ contractName: "USDC" });
  const { writeContractAsync: registryWrite, isMining } = useScaffoldWriteContract({
    contractName: "IndexerRegistry",
  });

  const myDisputes = useMemo(() => {
    if (!address || !disputeEvents) return [];
    return disputeEvents.filter(e => (e.args.disputer as string)?.toLowerCase() === address.toLowerCase());
  }, [disputeEvents, address]);

  const multiplier = disputerRecord ? Number(disputerRecord[2]) || 1 : 1;
  const lossCount = disputerRecord ? Number(disputerRecord[0]) : 0;

  // counterStake = boostStake * 25% * multiplier
  const boostStake = (registration?.[1] as bigint) ?? 0n;
  const counterStake = ((boostStake * 2_500n) / 10_000n) * BigInt(multiplier);

  if (!isConnected) {
    return (
      <Center>
        <button className="btn btn-primary" onClick={() => openConnectModal?.()}>
          Connect Wallet
        </button>
      </Center>
    );
  }
  if (chainId !== base.id) {
    return (
      <Center>
        <button className="btn btn-primary" onClick={() => switchChain?.({ chainId: base.id })}>
          Switch to Base
        </button>
      </Center>
    );
  }

  const handleApprove = async () => {
    if (approvalSubmitting || approvalCooldown) return;
    setApprovalSubmitting(true);
    try {
      await usdcWrite({ functionName: "approve", args: [REGISTRY_ADDRESS, counterStake] });
      setApprovalCooldown(true);
      setTimeout(() => {
        setApprovalCooldown(false);
        refetchAllowance();
      }, 4000);
    } catch {
      notification.error("Approval failed");
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!isHex(regId) || regId.length !== 66) {
      notification.error("Reg ID must be 32-byte hex");
      return;
    }
    if (!isHex(claimHash) || claimHash.length !== 66) {
      notification.error("Claim hash must be 32-byte hex");
      return;
    }
    try {
      await registryWrite({
        functionName: "openDispute",
        args: [regId as `0x${string}`, claimHash as `0x${string}`],
      });
    } catch {
      notification.error("Open dispute failed");
    }
  };

  const needsApproval = (allowance ?? 0n) < counterStake || counterStake === 0n;

  return (
    <div className="flex flex-col grow w-full px-4 sm:px-8 py-8 max-w-3xl mx-auto gap-6">
      <h1 className="text-3xl font-bold">Disputes</h1>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Open a Dispute</h2>
          <label className="form-control w-full">
            <span className="label-text mb-1">Reg ID (bytes32)</span>
            <input
              type="text"
              className="input input-bordered w-full font-mono"
              value={regId}
              onChange={e => setRegId(e.target.value.trim())}
              placeholder="0x… registration id"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Claim hash (bytes32)</span>
            <input
              type="text"
              className="input input-bordered w-full font-mono"
              value={claimHash}
              onChange={e => setClaimHash(e.target.value.trim())}
              placeholder="0x… what you claim happened"
            />
          </label>
          <p className="text-sm text-base-content/70">
            Counter-stake required: <span className="font-semibold">{usd(counterStake)}</span>{" "}
            <span className="text-base-content/50">(25% of boost × {multiplier}x multiplier)</span>
          </p>
          {needsApproval ? (
            <button
              className="btn btn-primary"
              disabled={approvalSubmitting || approvalCooldown || counterStake === 0n}
              onClick={handleApprove}
            >
              {approvalSubmitting || approvalCooldown ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Approve USDC"
              )}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={isMining} onClick={handleOpenDispute}>
              {isMining ? <span className="loading loading-spinner loading-sm" /> : "Open Dispute"}
            </button>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">My Disputes</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Dispute ID</th>
                  <th>Reg ID</th>
                  <th>State</th>
                  <th>Timers</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myDisputes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-base-content/50">
                      You have no disputes.
                    </td>
                  </tr>
                )}
                {myDisputes.map((e, i) => (
                  <DisputeRow
                    key={`${e.args.disputeId}-${i}`}
                    disputeId={e.args.disputeId as string}
                    regId={e.args.regId as string}
                    isIndexer={(e.args.indexer as string)?.toLowerCase() === address?.toLowerCase()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Your Disputer Record</h2>
          <div className="flex gap-8">
            <div>
              <span className="text-sm text-base-content/60 block">Multiplier</span>
              <span className="text-xl font-bold">{multiplier}x</span>
            </div>
            <div>
              <span className="text-sm text-base-content/60 block">Loss count</span>
              <span className="text-xl font-bold">{lossCount}</span>
            </div>
            <div>
              <span className="text-sm text-base-content/60 block">Address</span>
              <Address address={address} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col grow items-center justify-center py-20 gap-4">{children}</div>
);

const Disputes: NextPage = () => (
  <ClientOnly>
    <DisputesInner />
  </ClientOnly>
);

export default Disputes;
