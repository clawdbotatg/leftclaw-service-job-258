# NEXT_STEPS.md — Event Indexer Registry

## LogInclusionVerifier — full EIP-4788 + Patricia trie implementation

`contracts/LogInclusionVerifier.sol` is currently a stub that always returns `false`. This means disputes can only resolve via the 24h expiry timeout; an indexer cannot prove a log was included on-chain and win a dispute before the window expires.

### What's needed

1. **EIP-4788 beacon root lookup**
   The `BeaconRoots` contract at `0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02` (deployed on all post-Cancun chains) exposes `get(uint256 timestamp) → bytes32 beaconBlockRoot`. Compute the slot from the timestamp, then call it to obtain the trusted beacon block root for the block in question.

2. **Beacon body proof (SSZ)**
   Prove the `ExecutionPayload` is part of the `BeaconBlockBody` using a Merkle branch against the beacon block root. Requires:
   - SSZ Merkle multiproof from the consensus client
   - Generalised index of `ExecutionPayload` in `BeaconBlockBody` (spec-defined)

3. **ExecutionPayload → receiptsRoot**
   Prove `receiptsRoot` is the field at generalised index 7 of `ExecutionPayload`, again via SSZ Merkle branch.

4. **Receipts Patricia trie proof**
   Given `receiptsRoot`, prove a specific receipt is at the expected trie key using a standard Ethereum Patricia trie proof (array of RLP-encoded nodes). Libraries: `ethereum/patricia-trie` or Axiom's `LibMPT`.

5. **Receipt → log decoding**
   Decode the RLP-encoded receipt, find the log at `logIndex`, and verify `emitter == claimedEmitter` and `topics[0] == claimedTopic0`.

### Interface (already defined)

```solidity
struct ProofData {
    uint64  slot;
    bytes32[] beaconBodyFields;   // Merkle branch: beacon block → body
    bytes32[] executionPayloadFields; // Merkle branch: body → execution payload
    bytes32   receiptsRoot;
    bytes[]   trieNodes;          // Patricia trie proof
    bytes     encodedReceipt;     // RLP-encoded receipt
    uint256   logIndex;
    address   claimedEmitter;
    bytes32   claimedTopic0;
}

function verifyLogInclusion(ProofData calldata proof) external view returns (bool);
```

The stub is in `contracts/LogInclusionVerifier.sol`. Drop in the real implementation and remove the `// STUB` comment — `IndexerRegistry.sol` already calls it at line ~460.

### Reference implementations / prior art

- [Axiom's EIP-4788 + MPT work](https://github.com/axiom-crypto/axiom-std)
- [Succinct's SP1 beacon root circuits](https://github.com/succinctlabs/sp1)
- [ethereum/consensus-specs](https://github.com/ethereum/consensus-specs) for SSZ generalised indices

### Estimated effort

2–5 engineer-days for a production-quality pure Solidity verifier; less if using an off-chain proof generation service (Axiom, Brevis, Risc0).

---

## Gas optimisation

- Replace `keccak256(abi.encode(...))` in `regId` derivation with `keccak256(abi.encodePacked(...))` after audit
- Pack `Registration` struct fields to reduce storage slots (indexer + timestamp can share a slot)
- Consider `SSTORE2` for storing event sig strings if consumers need to read them on-chain

## Fee model

Current `QUERY_FEE_MIN = 0.01 USDC` is a constant; a future version could let registrations set their own per-query fee floor.

## Consumer-side tooling

- x402 middleware wrapper for Node.js/Python that auto-signs settlement receipts
- SDK: `indexer-client` npm package wrapping the EIP-712 signing flow
