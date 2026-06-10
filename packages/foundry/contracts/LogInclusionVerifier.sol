// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct ProofData {
    uint64 slot;
    bytes32[] beaconBodyFields; // SSZ beacon block body merkle fields
    bytes32[] executionPayloadFields; // SSZ execution payload fields
    bytes32 receiptsRoot;
    bytes[] trieNodes; // Patricia trie proof nodes
    bytes encodedReceipt; // RLP-encoded receipt
    uint256 logIndex; // index within receipt logs
    address claimedEmitter; // contract that emitted the log
    bytes32 claimedTopic0; // first topic of the log
}

/**
 * @title LogInclusionVerifier
 * @notice Verifies that a specific log event was included in a Base block using the
 *         EIP-4788 beacon block root plus a Patricia Merkle trie proof.
 *
 * @dev ============================================================================
 *      STUB IMPLEMENTATION — `verifyLogInclusion` ALWAYS RETURNS FALSE.
 *      ============================================================================
 *
 *      This is an intentional, compile-clean placeholder. Because it always returns
 *      false, an indexer can NEVER win a dispute by submitting a proof. Disputes can
 *      therefore only resolve in favor of the indexer if the disputer abandons it, or
 *      against the indexer by expiry (see IndexerRegistry.resolveExpiredDispute). This
 *      is a conservative posture: the protocol cannot be tricked into accepting a bogus
 *      proof, at the cost of honest indexers being unable to defend on-chain until the
 *      full verifier ships.
 *
 *      The full implementation requires the following pipeline:
 *        1. Read the beacon block root for `slot` from the EIP-4788 BEACON_ROOTS
 *           contract (staticcall with the timestamp/slot key).
 *        2. SSZ-hash the beacon block body merkle fields (`beaconBodyFields`) and
 *           verify they reconstruct the stored beacon root.
 *        3. Extract the execution payload `receiptsRoot` from `executionPayloadFields`
 *           and verify it commits into the beacon body.
 *        4. Traverse the Patricia Merkle trie using `trieNodes`, hashing each node and
 *           following the path keyed by the receipt's transaction index until reaching
 *           `encodedReceipt` under `receiptsRoot`.
 *        5. RLP-decode the receipt and index into its logs array at `logIndex`.
 *        6. Verify the log's emitter equals `claimedEmitter` and its first topic equals
 *           `claimedTopic0`.
 *
 *      See NEXT_STEPS.md for the full implementation specification.
 */
library LogInclusionVerifier {
    // EIP-4788 beacon roots contract (pre-deploy on all post-Cancun EVM chains, incl. Base).
    address constant BEACON_ROOTS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    /**
     * @notice Verify that a specific log event was included in a Base block.
     * @dev STUB IMPLEMENTATION — always returns false. See contract-level NatSpec.
     */
    function verifyLogInclusion(ProofData calldata) internal view returns (bool) {
        // Reference the constant so the compiler does not flag it as unused; the beacon
        // roots contract genuinely exists on Base and is the anchor for the real proof.
        BEACON_ROOTS;
        return false;
    }
}
