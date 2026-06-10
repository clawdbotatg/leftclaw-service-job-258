import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  8453: {
    IndexerRegistry: {
      address: "0x006835B9faf4f5244f860862809eCAE555f0abC8",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "treasury",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "BASE_SLASH_COOLDOWN",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "BASE_SLASH_PCT",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "BASE_WITHDRAWAL_COOLDOWN",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "BOOST_SLASH_PCT",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "BOOST_WITHDRAWAL_COOLDOWN",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "BPS_DENOMINATOR",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "BURN_ADDRESS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "CLAWD",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "contract IERC20",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "CLAWD_USDC_V3_POOL",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "contract IUniswapV3Pool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "DISPUTE_COUNTER_STAKE_BPS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "DISPUTE_RESPONSE_SECS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "DISPUTE_WINDOW_SECS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "MAX_BATCH_SIZE",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "MIN_BASE_STAKE",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "MIN_QUERY_FEE",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "POOL_FEE",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint24",
              internalType: "uint24",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "RATE_LIMIT_WINDOW",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "RESOLUTION_BUFFER",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "REVEAL_WINDOW_SECS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "SETTLEMENT_TYPEHASH",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "TREASURY",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "TWAP_WINDOW",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "UNISWAP_V3_ROUTER",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "contract ISwapRouter",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "USDC",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "contract IERC20",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "boostUnlockTime",
          inputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint64",
              internalType: "uint64",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "buybackReserveUSDC",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "commitResponse",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "proofHash",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "consumerSettlements",
          inputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "depositBaseStake",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "deregister",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "disputerRecords",
          inputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "lossCount",
              type: "uint8",
              internalType: "uint8",
            },
            {
              name: "lastLossAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "multiplier",
              type: "uint8",
              internalType: "uint8",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "disputes",
          inputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "disputer",
              type: "address",
              internalType: "address",
            },
            {
              name: "indexer",
              type: "address",
              internalType: "address",
            },
            {
              name: "regId",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "counterStake",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "atRiskBoost",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "openedAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "commitHash",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "committedAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "state",
              type: "uint8",
              internalType: "enum IndexerRegistry.DisputeState",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "eip712Domain",
          inputs: [],
          outputs: [
            {
              name: "fields",
              type: "bytes1",
              internalType: "bytes1",
            },
            {
              name: "name",
              type: "string",
              internalType: "string",
            },
            {
              name: "version",
              type: "string",
              internalType: "string",
            },
            {
              name: "chainId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "verifyingContract",
              type: "address",
              internalType: "address",
            },
            {
              name: "salt",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "extensions",
              type: "uint256[]",
              internalType: "uint256[]",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "executeBuyback",
          inputs: [
            {
              name: "minClawdOut",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "indexers",
          inputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "baseStake",
              type: "uint128",
              internalType: "uint128",
            },
            {
              name: "registrationCount",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "deregisteredAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "lastSlashAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "slashCount",
              type: "uint8",
              internalType: "uint8",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "openDispute",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "claimHash",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "disputeId",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "openDisputeCount",
          inputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "regHasOpenDispute",
          inputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "register",
          inputs: [
            {
              name: "target",
              type: "address",
              internalType: "address",
            },
            {
              name: "eventSig",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "boost",
              type: "uint96",
              internalType: "uint96",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "registerBatch",
          inputs: [
            {
              name: "targets",
              type: "address[]",
              internalType: "address[]",
            },
            {
              name: "eventSigs",
              type: "bytes32[]",
              internalType: "bytes32[]",
            },
            {
              name: "boosts",
              type: "uint96[]",
              internalType: "uint96[]",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "registrations",
          inputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "targetContract",
              type: "address",
              internalType: "address",
            },
            {
              name: "boostStake",
              type: "uint96",
              internalType: "uint96",
            },
            {
              name: "eventSigHash",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "registeredAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "deregisteredAt",
              type: "uint64",
              internalType: "uint64",
            },
            {
              name: "indexer",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "reputationScore",
          inputs: [
            {
              name: "",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "rescueToken",
          inputs: [
            {
              name: "token",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "resolveExpiredDispute",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "revealResponse",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "proof",
              type: "tuple",
              internalType: "struct ProofData",
              components: [
                {
                  name: "slot",
                  type: "uint64",
                  internalType: "uint64",
                },
                {
                  name: "beaconBodyFields",
                  type: "bytes32[]",
                  internalType: "bytes32[]",
                },
                {
                  name: "executionPayloadFields",
                  type: "bytes32[]",
                  internalType: "bytes32[]",
                },
                {
                  name: "receiptsRoot",
                  type: "bytes32",
                  internalType: "bytes32",
                },
                {
                  name: "trieNodes",
                  type: "bytes[]",
                  internalType: "bytes[]",
                },
                {
                  name: "encodedReceipt",
                  type: "bytes",
                  internalType: "bytes",
                },
                {
                  name: "logIndex",
                  type: "uint256",
                  internalType: "uint256",
                },
                {
                  name: "claimedEmitter",
                  type: "address",
                  internalType: "address",
                },
                {
                  name: "claimedTopic0",
                  type: "bytes32",
                  internalType: "bytes32",
                },
              ],
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "settleQuery",
          inputs: [
            {
              name: "s",
              type: "tuple",
              internalType: "struct IndexerRegistry.Settlement",
              components: [
                {
                  name: "indexer",
                  type: "address",
                  internalType: "address",
                },
                {
                  name: "regId",
                  type: "bytes32",
                  internalType: "bytes32",
                },
                {
                  name: "queryCount",
                  type: "uint32",
                  internalType: "uint32",
                },
                {
                  name: "totalFeeUSDC",
                  type: "uint256",
                  internalType: "uint256",
                },
                {
                  name: "consumerNonce",
                  type: "uint256",
                  internalType: "uint256",
                },
                {
                  name: "consumer",
                  type: "address",
                  internalType: "address",
                },
                {
                  name: "expiry",
                  type: "uint64",
                  internalType: "uint64",
                },
              ],
            },
            {
              name: "sig",
              type: "bytes",
              internalType: "bytes",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "usedNonces",
          inputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "withdrawBaseStake",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "withdrawBoost",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "BaseStakeDeposited",
          inputs: [
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "newBaseStake",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "BaseStakeWithdrawn",
          inputs: [
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "BoostWithdrawn",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "BuybackExecuted",
          inputs: [
            {
              name: "usdcIn",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "clawdOut",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "twapFloor",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "Deregistered",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "unlockTime",
              type: "uint64",
              indexed: false,
              internalType: "uint64",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "DisputeOpened",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "regId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "disputer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "indexer",
              type: "address",
              indexed: false,
              internalType: "address",
            },
            {
              name: "counterStake",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "atRiskBoost",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "DisputeResolved",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "state",
              type: "uint8",
              indexed: false,
              internalType: "enum IndexerRegistry.DisputeState",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "EIP712DomainChanged",
          inputs: [],
          anonymous: false,
        },
        {
          type: "event",
          name: "IndexerSlashed",
          inputs: [
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "regId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "boostSlashed",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "baseSlashed",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "toDisputer",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "toBuyback",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "toTreasury",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "QuerySettled",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "consumer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "totalFee",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "indexerShare",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "treasuryShare",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "buybackShare",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "Registered",
          inputs: [
            {
              name: "regId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "indexer",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "target",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "eventSig",
              type: "bytes32",
              indexed: false,
              internalType: "bytes32",
            },
            {
              name: "boost",
              type: "uint96",
              indexed: false,
              internalType: "uint96",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "ResponseCommitted",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "commitHash",
              type: "bytes32",
              indexed: false,
              internalType: "bytes32",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "ResponseRevealed",
          inputs: [
            {
              name: "disputeId",
              type: "bytes32",
              indexed: true,
              internalType: "bytes32",
            },
            {
              name: "proven",
              type: "bool",
              indexed: false,
              internalType: "bool",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "TokenRescued",
          inputs: [
            {
              name: "token",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "BadSignature",
          inputs: [],
        },
        {
          type: "error",
          name: "BatchTooLarge",
          inputs: [],
        },
        {
          type: "error",
          name: "BelowMinStake",
          inputs: [],
        },
        {
          type: "error",
          name: "CannotRescueUSDC",
          inputs: [],
        },
        {
          type: "error",
          name: "CommitMismatch",
          inputs: [],
        },
        {
          type: "error",
          name: "DisputeNotFound",
          inputs: [],
        },
        {
          type: "error",
          name: "DuplicateInBatch",
          inputs: [],
        },
        {
          type: "error",
          name: "ECDSAInvalidSignature",
          inputs: [],
        },
        {
          type: "error",
          name: "ECDSAInvalidSignatureLength",
          inputs: [
            {
              name: "length",
              type: "uint256",
              internalType: "uint256",
            },
          ],
        },
        {
          type: "error",
          name: "ECDSAInvalidSignatureS",
          inputs: [
            {
              name: "s",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
        },
        {
          type: "error",
          name: "FeeTooLow",
          inputs: [],
        },
        {
          type: "error",
          name: "HasOpenDisputes",
          inputs: [],
        },
        {
          type: "error",
          name: "HasRegistrations",
          inputs: [],
        },
        {
          type: "error",
          name: "InsufficientBaseStake",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidShortString",
          inputs: [],
        },
        {
          type: "error",
          name: "LengthMismatch",
          inputs: [],
        },
        {
          type: "error",
          name: "NonceUsed",
          inputs: [],
        },
        {
          type: "error",
          name: "NotIndexer",
          inputs: [],
        },
        {
          type: "error",
          name: "RateLimited",
          inputs: [],
        },
        {
          type: "error",
          name: "RegistrationExists",
          inputs: [],
        },
        {
          type: "error",
          name: "RegistrationNotFound",
          inputs: [],
        },
        {
          type: "error",
          name: "SafeERC20FailedOperation",
          inputs: [
            {
              name: "token",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "StillLocked",
          inputs: [],
        },
        {
          type: "error",
          name: "StringTooLong",
          inputs: [
            {
              name: "str",
              type: "string",
              internalType: "string",
            },
          ],
        },
        {
          type: "error",
          name: "WindowClosed",
          inputs: [],
        },
        {
          type: "error",
          name: "WindowNotElapsed",
          inputs: [],
        },
        {
          type: "error",
          name: "WrongState",
          inputs: [],
        },
      ],
      inheritedFunctions: {},
    },
  },
} as const satisfies GenericContractsDeclaration;

export default deployedContracts;
