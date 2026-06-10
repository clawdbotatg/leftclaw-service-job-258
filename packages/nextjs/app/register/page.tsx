"use client";

import { useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatUnits, isAddress, isHex, parseUnits } from "viem";
import { base } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ClientOnly } from "~~/components/ClientOnly";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { REGISTRY_ADDRESS } from "~~/utils/registry";
import { notification } from "~~/utils/scaffold-eth";

const MIN_BASE_STAKE_USDC = 1; // $1
const MIN_BOOST_USDC = 0.01; // $0.01

const RegisterInner = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain();

  // Deposit step state
  const [depositAmount, setDepositAmount] = useState("1");

  // Register step state
  const [target, setTarget] = useState("");
  const [eventSig, setEventSig] = useState("");
  const [boost, setBoost] = useState("0.01");

  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalCooldown, setApprovalCooldown] = useState(false);

  const { data: indexer } = useScaffoldReadContract({
    contractName: "IndexerRegistry",
    functionName: "indexers",
    args: [address],
  });

  const { data: allowance, refetch: refetchAllowance } = useScaffoldReadContract({
    contractName: "USDC",
    functionName: "allowance",
    args: [address, REGISTRY_ADDRESS],
  });

  const { writeContractAsync: usdcWrite } = useScaffoldWriteContract({ contractName: "USDC" });
  const { writeContractAsync: registryWrite, isMining } = useScaffoldWriteContract({
    contractName: "IndexerRegistry",
  });

  const baseStake = (indexer?.[0] as bigint) ?? 0n;
  const hasBaseStake = baseStake >= parseUnits(String(MIN_BASE_STAKE_USDC), 6);

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

  const handleApprove = async (amount: bigint) => {
    if (approvalSubmitting || approvalCooldown) return;
    setApprovalSubmitting(true);
    try {
      await usdcWrite({ functionName: "approve", args: [REGISTRY_ADDRESS, amount] });
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

  const handleDeposit = async () => {
    let amount: bigint;
    try {
      amount = parseUnits(depositAmount || "0", 6);
    } catch {
      notification.error("Invalid amount");
      return;
    }
    if (amount < parseUnits(String(MIN_BASE_STAKE_USDC), 6)) {
      notification.error(`Minimum base stake is $${MIN_BASE_STAKE_USDC.toFixed(2)}`);
      return;
    }
    try {
      await registryWrite({ functionName: "depositBaseStake", args: [amount] });
    } catch {
      notification.error("Deposit failed");
    }
  };

  const handleRegister = async () => {
    if (!isAddress(target)) {
      notification.error("Invalid target contract address");
      return;
    }
    if (!isHex(eventSig) || eventSig.length !== 66) {
      notification.error("Event signature must be a 32-byte hex (0x + 64 chars)");
      return;
    }
    let boostAmount: bigint;
    try {
      boostAmount = parseUnits(boost || "0", 6);
    } catch {
      notification.error("Invalid boost amount");
      return;
    }
    if (boostAmount < parseUnits(String(MIN_BOOST_USDC), 6)) {
      notification.error(`Minimum boost is $${MIN_BOOST_USDC.toFixed(2)}`);
      return;
    }
    try {
      await registryWrite({
        functionName: "register",
        args: [target, eventSig as `0x${string}`, boostAmount],
      });
    } catch {
      notification.error("Registration failed");
    }
  };

  const depositWei = (() => {
    try {
      return parseUnits(depositAmount || "0", 6);
    } catch {
      return 0n;
    }
  })();
  const boostWei = (() => {
    try {
      return parseUnits(boost || "0", 6);
    } catch {
      return 0n;
    }
  })();

  const depositNeedsApproval = (allowance ?? 0n) < depositWei;
  const boostNeedsApproval = (allowance ?? 0n) < boostWei;

  return (
    <div className="flex flex-col grow w-full px-4 sm:px-8 py-8 max-w-2xl mx-auto gap-6">
      <h1 className="text-3xl font-bold">Register as Indexer</h1>

      {/* Step 1: Base stake */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Step 1 — Deposit Base Stake</h2>
          {hasBaseStake ? (
            <p className="text-success font-medium">Base stake: ${Number(formatUnits(baseStake, 6)).toFixed(2)} ✓</p>
          ) : (
            <>
              <p className="text-base-content/70 text-sm">
                Deposit at least ${MIN_BASE_STAKE_USDC.toFixed(2)} USDC to become an indexer.
              </p>
              <label className="form-control w-full">
                <span className="label-text mb-1">USDC amount</span>
                <input
                  type="number"
                  min={MIN_BASE_STAKE_USDC}
                  step="0.01"
                  className="input input-bordered w-full"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                />
              </label>
              {depositNeedsApproval ? (
                <button
                  className="btn btn-primary"
                  disabled={approvalSubmitting || approvalCooldown}
                  onClick={() => handleApprove(depositWei)}
                >
                  {approvalSubmitting || approvalCooldown ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Approve USDC"
                  )}
                </button>
              ) : (
                <button className="btn btn-primary" disabled={isMining} onClick={handleDeposit}>
                  {isMining ? <span className="loading loading-spinner loading-sm" /> : "Deposit Base Stake"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Step 2: Register pair */}
      <div className={`card bg-base-100 shadow-md ${!hasBaseStake ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="card-body">
          <h2 className="card-title">Step 2 — Register a (contract, event) pair</h2>
          <label className="form-control w-full">
            <span className="label-text mb-1">Target contract</span>
            <AddressInput value={target} onChange={setTarget} placeholder="0x… contract address" />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Event signature hash (bytes32 topic)</span>
            <input
              type="text"
              className="input input-bordered w-full font-mono"
              value={eventSig}
              onChange={e => setEventSig(e.target.value.trim())}
              placeholder="0x… 32-byte event signature hash"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Boost (USDC)</span>
            <input
              type="number"
              min={MIN_BOOST_USDC}
              step="0.01"
              className="input input-bordered w-full"
              value={boost}
              onChange={e => setBoost(e.target.value)}
            />
          </label>
          <p className="text-sm text-base-content/60">
            Total USDC cost: ${Number(formatUnits(boostWei, 6)).toFixed(2)}
          </p>
          {boostNeedsApproval ? (
            <button
              className="btn btn-primary"
              disabled={approvalSubmitting || approvalCooldown}
              onClick={() => handleApprove(boostWei)}
            >
              {approvalSubmitting || approvalCooldown ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Approve USDC"
              )}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={isMining} onClick={handleRegister}>
              {isMining ? <span className="loading loading-spinner loading-sm" /> : "Register"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col grow items-center justify-center py-20 gap-4">{children}</div>
);

const Register: NextPage = () => (
  <ClientOnly>
    <RegisterInner />
  </ClientOnly>
);

export default Register;
