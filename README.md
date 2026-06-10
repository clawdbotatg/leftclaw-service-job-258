# Event Indexer Registry

A permissionless on-chain registry on Base where indexer agents stake USDC to register `(contract, eventSig)` pairs and consumer agents pay USDC per query via x402. Solves the subgraph cold-start gap for freshly-deployed Base contracts. No admin, no upgradeability.

## Live Deployment

- **Frontend:** *(IPFS URL will be added after deploy)*
- **Contract:** [0x006835B9faf4f5244f860862809eCAE555f0abC8](https://base.blockscout.com/address/0x006835b9faf4f5244f860862809ecae555f0abc8) on Base

## Architecture

### IndexerRegistry.sol

One ownerless contract handles the full lifecycle:

- **Indexers** deposit a $1 USDC base stake, then register `(targetContract, eventSigHash, boostStake)` pairs
- **Consumers** pay per-query fees via signed EIP-712 `Settlement` receipts; the indexer or consumer submits on-chain to settle
- **Disputes** use a commit-reveal flow — the disputer stakes 25% of the indexer's boost; if the indexer fails to prove log inclusion within 24h, they are slashed
- **Buyback** — 1% of all query fees accumulate as `buybackReserveUSDC`; anyone can call `executeBuyback()` to swap USDC→CLAWD via Uniswap V3 and burn the CLAWD to `0xdead`

### Key constants

| Parameter | Value |
|---|---|
| Minimum base stake | $1 USDC |
| Minimum query fee | $0.01 USDC |
| Dispute window | 24h |
| Boost withdrawal cooldown | 30h |
| Base stake withdrawal cooldown | 7d |
| Fee split | 98% indexer, 1% treasury, 1% buyback |

## Frontend

Four pages built with Scaffold-ETH 2 (static IPFS export):

| Route | Description |
|---|---|
| `/` | Indexer dashboard — live registrations, stats, your registrations |
| `/register` | Deposit base stake + register (contract, event) pairs |
| `/consumers` | How to query indexers; search registrations by (contract, eventSig) |
| `/disputes` | Open disputes, track deadlines, resolve expired disputes |

## Running Locally

```bash
# Install dependencies
yarn install

# Start local chain (fork Base)
yarn fork --network base

# Deploy contracts locally
yarn deploy

# Start frontend
yarn start
```

## Client Actions Required

The contract is deployed with `TREASURY = 0xcfb32a7d01ca2b4b538c83b2b38656d3502d76ea`. No ownership transfer is needed (ownerless contract).

## Known Limitations

The `LogInclusionVerifier` (EIP-4788 + Patricia trie proof) is stubbed — disputes can currently only resolve by expiry (24h timeout), not by indexer proof. See `NEXT_STEPS.md` for the full implementation spec.

## GitHub

[clawdbotatg/leftclaw-service-job-258](https://github.com/clawdbotatg/leftclaw-service-job-258)
