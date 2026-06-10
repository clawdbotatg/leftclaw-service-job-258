// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import { IUniswapV3Pool } from "./interfaces/IUniswapV3Pool.sol";
import { ISwapRouter } from "./interfaces/ISwapRouter.sol";
import { LogInclusionVerifier, ProofData } from "./LogInclusionVerifier.sol";

/**
 * @title IndexerRegistry
 * @notice Permissionless registry for event indexers. Indexers post a base stake and
 *         per-registration boost stakes in USDC to advertise that they will index a
 *         given (contract, event) pair. Consumers pay query fees, settled via signed
 *         EIP-712 receipts. Anyone can dispute an indexer; disputes resolve either by
 *         the indexer proving log inclusion (commit/reveal + LogInclusionVerifier) or by
 *         expiry, in which case the indexer is slashed and proceeds are distributed.
 *
 * @dev The contract is ownerless. All parameters are immutable or hardcoded. Uses
 *      EIP-1153 transient storage for reentrancy protection (requires the Cancun EVM,
 *      available on Base).
 */
contract IndexerRegistry is EIP712 {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Immutables / constants
    // ---------------------------------------------------------------------

    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC20 public constant CLAWD = IERC20(0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07);
    IUniswapV3Pool public constant CLAWD_USDC_V3_POOL =
        IUniswapV3Pool(0xb72A6e1091D43e19284050b7132e0646509EBa5d);
    ISwapRouter public constant UNISWAP_V3_ROUTER = ISwapRouter(0x2626664c2603336E57B271c5C0b26F421741e481);
    uint24 public constant POOL_FEE = 10_000; // CLAWD/USDC pool fee tier (bps of the V3 fee encoding)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public immutable TREASURY;

    uint256 public constant MIN_BASE_STAKE = 1_000_000; // $1 USDC
    uint256 public constant MIN_QUERY_FEE = 10_000; // $0.01 USDC
    uint256 public constant BASE_SLASH_PCT = 2_000; // 20% in bps
    uint256 public constant BOOST_SLASH_PCT = 10_000; // 100% in bps
    uint256 public constant DISPUTE_COUNTER_STAKE_BPS = 2_500; // 25% in bps
    uint256 public constant DISPUTE_WINDOW_SECS = 86_400; // 24h
    uint256 public constant DISPUTE_RESPONSE_SECS = 21_600; // 6h
    uint256 public constant REVEAL_WINDOW_SECS = 3_600; // 1h reveal after commit
    uint256 public constant RESOLUTION_BUFFER = 300; // 5min MEV buffer
    uint256 public constant BOOST_WITHDRAWAL_COOLDOWN = 108_000; // 30h
    uint256 public constant BASE_WITHDRAWAL_COOLDOWN = 604_800; // 7d
    uint256 public constant BASE_SLASH_COOLDOWN = 259_200; // 72h
    uint256 public constant TWAP_WINDOW = 7_200; // 2h
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant RATE_LIMIT_WINDOW = 86_400; // rolling 24h for dispute rate limit

    // ---------------------------------------------------------------------
    // EIP-712
    // ---------------------------------------------------------------------

    bytes32 public constant SETTLEMENT_TYPEHASH = keccak256(
        "Settlement(address indexer,bytes32 regId,uint32 queryCount,uint256 totalFeeUSDC,uint256 consumerNonce,address consumer)"
    );

    struct Settlement {
        address indexer;
        bytes32 regId;
        uint32 queryCount;
        uint256 totalFeeUSDC;
        uint256 consumerNonce;
        address consumer;
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    struct IndexerRecord {
        uint128 baseStake;
        uint64 registrationCount;
        uint64 deregisteredAt;
        uint64 lastSlashAt;
        uint8 slashCount;
    }

    mapping(address => IndexerRecord) public indexers;

    struct Registration {
        address targetContract; // packed with boostStake in slot 0
        uint96 boostStake;
        bytes32 eventSigHash;
        uint64 registeredAt;
        uint64 deregisteredAt;
        address indexer;
    }

    // regId = keccak256(abi.encode(indexer, targetContract, eventSigHash))
    mapping(bytes32 => Registration) public registrations;

    mapping(bytes32 => mapping(address => uint256)) public consumerSettlements;
    mapping(bytes32 => uint256) public reputationScore;

    // replay protection for settlement signatures
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    enum DisputeState {
        Pending,
        CommitReceived,
        ResolvedDisputer,
        ResolvedIndexer,
        Expired
    }

    struct Dispute {
        address disputer;
        address indexer;
        bytes32 regId;
        uint256 counterStake;
        uint256 atRiskBoost;
        uint64 openedAt;
        bytes32 commitHash;
        uint64 committedAt;
        DisputeState state;
    }

    mapping(bytes32 => Dispute) public disputes;
    // number of open (unresolved) disputes per indexer; gates withdrawals/registration
    mapping(address => uint256) public openDisputeCount;
    // whether a registration currently has an open dispute
    mapping(bytes32 => bool) public regHasOpenDispute;

    // rate limit ring buffer: disputer => indexer => last 3 dispute timestamps
    mapping(address => mapping(address => uint64[3])) private disputeTimestamps;

    struct DisputerRecord {
        uint8 lossCount;
        uint64 lastLossAt;
        uint8 multiplier; // 1x-10x
    }

    mapping(address => DisputerRecord) public disputerRecords;

    uint256 public buybackReserveUSDC;
    mapping(bytes32 => uint64) public boostUnlockTime;

    // ---------------------------------------------------------------------
    // Reentrancy guard (EIP-1153 transient storage)
    // ---------------------------------------------------------------------

    // keccak256("REENTRANCY_GUARD") - 1, expressed as a literal so it can be used directly
    // inside inline assembly (computed constants are not allowed there).
    uint256 private constant REENTRANCY_GUARD_SLOT =
        0xdcb51ba0d43ef2c357eef48fbe953503faee8dce5ac87efb01aecad42d7420ce;

    modifier nonReentrantTransient() {
        uint256 slot = REENTRANCY_GUARD_SLOT;
        assembly {
            if tload(slot) { revert(0, 0) }
            tstore(slot, 1)
        }
        _;
        assembly {
            tstore(slot, 0)
        }
    }

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event BaseStakeDeposited(address indexed indexer, uint256 amount, uint256 newBaseStake);
    event BaseStakeWithdrawn(address indexed indexer, uint256 amount);
    event Registered(
        bytes32 indexed regId, address indexed indexer, address indexed target, bytes32 eventSig, uint96 boost
    );
    event Deregistered(bytes32 indexed regId, address indexed indexer, uint64 unlockTime);
    event BoostWithdrawn(bytes32 indexed regId, address indexed indexer, uint256 amount);
    event QuerySettled(
        bytes32 indexed regId,
        address indexed indexer,
        address indexed consumer,
        uint256 totalFee,
        uint256 indexerShare,
        uint256 treasuryShare,
        uint256 buybackShare
    );
    event DisputeOpened(
        bytes32 indexed disputeId,
        bytes32 indexed regId,
        address indexed disputer,
        address indexer,
        uint256 counterStake,
        uint256 atRiskBoost
    );
    event ResponseCommitted(bytes32 indexed disputeId, bytes32 commitHash);
    event ResponseRevealed(bytes32 indexed disputeId, bool proven);
    event DisputeResolved(bytes32 indexed disputeId, DisputeState state);
    event IndexerSlashed(
        address indexed indexer,
        bytes32 indexed regId,
        uint256 boostSlashed,
        uint256 baseSlashed,
        uint256 toDisputer,
        uint256 toBuyback,
        uint256 toTreasury
    );
    event BuybackExecuted(uint256 usdcIn, uint256 clawdOut, uint256 twapFloor);
    event TokenRescued(address indexed token, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error InsufficientBaseStake();
    error BelowMinStake();
    error HasOpenDisputes();
    error NotIndexer();
    error RegistrationExists();
    error RegistrationNotFound();
    error BatchTooLarge();
    error LengthMismatch();
    error DuplicateInBatch();
    error StillLocked();
    error HasRegistrations();
    error FeeTooLow();
    error NonceUsed();
    error BadSignature();
    error RateLimited();
    error DisputeNotFound();
    error WrongState();
    error WindowClosed();
    error WindowNotElapsed();
    error CommitMismatch();
    error CannotRescueUSDC();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address treasury) EIP712("IndexerRegistry", "1") {
        require(treasury != address(0), "treasury=0");
        TREASURY = treasury;
    }

    // ---------------------------------------------------------------------
    // Staking & registration
    // ---------------------------------------------------------------------

    /// @notice Deposit (or top up) base stake. Must bring total to >= MIN_BASE_STAKE.
    function depositBaseStake(uint256 amount) external nonReentrantTransient {
        if (amount < MIN_BASE_STAKE) revert BelowMinStake();
        IndexerRecord storage rec = indexers[msg.sender];
        uint256 newStake = uint256(rec.baseStake) + amount;
        // Effects
        rec.baseStake = uint128(newStake);
        // Interactions
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        emit BaseStakeDeposited(msg.sender, amount, newStake);
    }

    /// @notice Register intent to index a (target, eventSig) pair, locking a boost stake.
    function register(address target, bytes32 eventSig, uint96 boost) external nonReentrantTransient {
        bytes32 regId = _register(msg.sender, target, eventSig, boost);
        if (boost > 0) USDC.safeTransferFrom(msg.sender, address(this), boost);
        emit Registered(regId, msg.sender, target, eventSig, boost);
    }

    /// @notice Register many (target, eventSig) pairs atomically in a single USDC pull.
    function registerBatch(address[] calldata targets, bytes32[] calldata eventSigs, uint96[] calldata boosts)
        external
        nonReentrantTransient
    {
        uint256 n = targets.length;
        if (n == 0 || n > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (eventSigs.length != n || boosts.length != n) revert LengthMismatch();

        uint256 totalBoost;
        for (uint256 i = 0; i < n; i++) {
            // duplicate detection within the batch using transient storage keyed by regId
            bytes32 regId = keccak256(abi.encode(msg.sender, targets[i], eventSigs[i]));
            bool seen;
            assembly {
                seen := tload(regId)
            }
            if (seen) revert DuplicateInBatch();
            assembly {
                tstore(regId, 1)
            }

            _register(msg.sender, targets[i], eventSigs[i], boosts[i]);
            totalBoost += boosts[i];
            emit Registered(regId, msg.sender, targets[i], eventSigs[i], boosts[i]);
        }

        // clear transient duplicate markers so the slots are clean for any later txns
        for (uint256 i = 0; i < n; i++) {
            bytes32 regId = keccak256(abi.encode(msg.sender, targets[i], eventSigs[i]));
            assembly {
                tstore(regId, 0)
            }
        }

        if (totalBoost > 0) USDC.safeTransferFrom(msg.sender, address(this), totalBoost);
    }

    /// @dev Shared registration checks/effects (no token transfer here).
    function _register(address indexer, address target, bytes32 eventSig, uint96 boost) internal returns (bytes32 regId) {
        IndexerRecord storage rec = indexers[indexer];
        if (rec.baseStake < MIN_BASE_STAKE) revert InsufficientBaseStake();
        if (openDisputeCount[indexer] != 0) revert HasOpenDisputes();

        regId = keccak256(abi.encode(indexer, target, eventSig));
        Registration storage r = registrations[regId];
        // A live registration is one that exists and has not been deregistered.
        if (r.indexer != address(0) && r.deregisteredAt == 0) revert RegistrationExists();

        r.targetContract = target;
        r.boostStake = boost;
        r.eventSigHash = eventSig;
        r.registeredAt = uint64(block.timestamp);
        r.deregisteredAt = 0;
        r.indexer = indexer;

        rec.registrationCount += 1;
        boostUnlockTime[regId] = 0;
    }

    /// @notice Begin winding down a registration; starts the boost withdrawal cooldown.
    function deregister(bytes32 regId) external nonReentrantTransient {
        Registration storage r = registrations[regId];
        if (r.indexer != msg.sender) revert NotIndexer();
        if (r.deregisteredAt != 0) revert RegistrationNotFound();

        uint64 unlock = uint64(block.timestamp + BOOST_WITHDRAWAL_COOLDOWN);
        r.deregisteredAt = uint64(block.timestamp);
        boostUnlockTime[regId] = unlock;

        IndexerRecord storage rec = indexers[msg.sender];
        if (rec.registrationCount > 0) {
            rec.registrationCount -= 1;
        }
        // If this is the indexer's last live registration, start the base withdrawal clock.
        if (rec.registrationCount == 0) {
            rec.deregisteredAt = uint64(block.timestamp);
        }

        emit Deregistered(regId, msg.sender, unlock);
    }

    /// @notice Withdraw the boost for a deregistered registration after its cooldown.
    function withdrawBoost(bytes32 regId) external nonReentrantTransient {
        Registration storage r = registrations[regId];
        if (r.indexer != msg.sender) revert NotIndexer();
        uint64 unlock = boostUnlockTime[regId];
        if (unlock == 0 || block.timestamp < unlock) revert StillLocked();
        if (regHasOpenDispute[regId]) revert HasOpenDisputes();

        uint256 amount = r.boostStake;
        // Effects
        r.boostStake = 0;
        boostUnlockTime[regId] = 0;
        // Interactions
        if (amount > 0) USDC.safeTransfer(msg.sender, amount);
        emit BoostWithdrawn(regId, msg.sender, amount);
    }

    /// @notice Withdraw the full base stake once fully wound down and past cooldown.
    function withdrawBaseStake() external nonReentrantTransient {
        IndexerRecord storage rec = indexers[msg.sender];
        if (rec.registrationCount != 0) revert HasRegistrations();
        if (openDisputeCount[msg.sender] != 0) revert HasOpenDisputes();
        if (rec.deregisteredAt == 0 || block.timestamp < uint256(rec.deregisteredAt) + BASE_WITHDRAWAL_COOLDOWN) {
            revert StillLocked();
        }

        uint256 amount = rec.baseStake;
        // Effects: clear the entire record.
        delete indexers[msg.sender];
        // Interactions
        if (amount > 0) USDC.safeTransfer(msg.sender, amount);
        emit BaseStakeWithdrawn(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------------

    /// @notice Settle a batch of off-chain queries against a signed consumer receipt.
    function settleQuery(Settlement calldata s, bytes calldata sig) external nonReentrantTransient {
        // Checks
        if (usedNonces[s.consumer][s.consumerNonce]) revert NonceUsed();
        if (s.totalFeeUSDC < MIN_QUERY_FEE * uint256(s.queryCount)) revert FeeTooLow();

        bytes32 structHash = keccak256(
            abi.encode(
                SETTLEMENT_TYPEHASH,
                s.indexer,
                s.regId,
                s.queryCount,
                s.totalFeeUSDC,
                s.consumerNonce,
                s.consumer
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, sig);
        if (signer != s.consumer) revert BadSignature();

        // Split: 1% treasury, 1% buyback, remainder to indexer.
        uint256 treasuryShare = s.totalFeeUSDC / 100;
        uint256 buybackShare = s.totalFeeUSDC / 100;
        uint256 indexerShare = s.totalFeeUSDC - treasuryShare - buybackShare;

        // Effects
        usedNonces[s.consumer][s.consumerNonce] = true;
        if (consumerSettlements[s.regId][s.consumer] > 0) {
            // returning consumer for this registration -> reputation bump
            reputationScore[s.regId] += 1;
        }
        consumerSettlements[s.regId][s.consumer] += 1;
        buybackReserveUSDC += buybackShare;

        // Interactions: pull full fee from consumer, distribute.
        USDC.safeTransferFrom(s.consumer, address(this), s.totalFeeUSDC);
        if (treasuryShare > 0) USDC.safeTransfer(TREASURY, treasuryShare);
        if (indexerShare > 0) USDC.safeTransfer(s.indexer, indexerShare);

        emit QuerySettled(
            s.regId, s.indexer, s.consumer, s.totalFeeUSDC, indexerShare, treasuryShare, buybackShare
        );
    }

    // ---------------------------------------------------------------------
    // Disputes
    // ---------------------------------------------------------------------

    /// @notice Open a dispute against a registration's indexer, posting a counter stake.
    function openDispute(bytes32 regId, bytes32 claimHash)
        external
        nonReentrantTransient
        returns (bytes32 disputeId)
    {
        Registration storage r = registrations[regId];
        if (r.indexer == address(0)) revert RegistrationNotFound();
        address indexer = r.indexer;

        // Rate limit: max 3 disputes per (disputer, indexer) in any rolling 24h window.
        uint64[3] storage ts = disputeTimestamps[msg.sender][indexer];
        uint256 oldestIdx = 0;
        uint64 oldestVal = type(uint64).max;
        uint256 recentCount = 0;
        uint256 cutoff = block.timestamp > RATE_LIMIT_WINDOW ? block.timestamp - RATE_LIMIT_WINDOW : 0;
        for (uint256 i = 0; i < 3; i++) {
            if (ts[i] != 0 && ts[i] > cutoff) recentCount++;
            if (ts[i] < oldestVal) {
                oldestVal = ts[i];
                oldestIdx = i;
            }
        }
        if (recentCount >= 3) revert RateLimited();
        ts[oldestIdx] = uint64(block.timestamp);

        // Counter stake = boost * 25% * multiplier, capped at the full boost.
        DisputerRecord storage dr = disputerRecords[msg.sender];
        uint256 mult = dr.multiplier == 0 ? 1 : dr.multiplier;
        uint256 boost = r.boostStake;
        uint256 counterStake = (boost * DISPUTE_COUNTER_STAKE_BPS / BPS_DENOMINATOR) * mult;
        if (counterStake > boost) counterStake = boost;

        disputeId = keccak256(abi.encode(regId, msg.sender, claimHash, block.timestamp));

        // Effects
        Dispute storage d = disputes[disputeId];
        if (d.openedAt != 0) revert WrongState(); // collision / replay
        d.disputer = msg.sender;
        d.indexer = indexer;
        d.regId = regId;
        d.counterStake = counterStake;
        d.atRiskBoost = boost;
        d.openedAt = uint64(block.timestamp);
        d.state = DisputeState.Pending;

        openDisputeCount[indexer] += 1;
        regHasOpenDispute[regId] = true;

        // Interactions
        if (counterStake > 0) USDC.safeTransferFrom(msg.sender, address(this), counterStake);

        emit DisputeOpened(disputeId, regId, msg.sender, indexer, counterStake, boost);
    }

    /// @notice Indexer commits a hash of their proof before the response deadline.
    function commitResponse(bytes32 disputeId, bytes32 proofHash) external nonReentrantTransient {
        Dispute storage d = disputes[disputeId];
        if (d.openedAt == 0) revert DisputeNotFound();
        if (d.indexer != msg.sender) revert NotIndexer();
        if (d.state != DisputeState.Pending) revert WrongState();
        if (block.timestamp > uint256(d.openedAt) + DISPUTE_RESPONSE_SECS) revert WindowClosed();

        d.commitHash = proofHash;
        d.committedAt = uint64(block.timestamp);
        d.state = DisputeState.CommitReceived;

        emit ResponseCommitted(disputeId, proofHash);
    }

    /// @notice Indexer reveals the proof; on a valid inclusion proof, they win the dispute.
    function revealResponse(bytes32 disputeId, ProofData calldata proof) external nonReentrantTransient {
        Dispute storage d = disputes[disputeId];
        if (d.openedAt == 0) revert DisputeNotFound();
        if (d.indexer != msg.sender) revert NotIndexer();
        if (d.state != DisputeState.CommitReceived) revert WrongState();
        if (block.timestamp > uint256(d.committedAt) + REVEAL_WINDOW_SECS) revert WindowClosed();
        if (keccak256(abi.encode(proof)) != d.commitHash) revert CommitMismatch();

        bool proven = LogInclusionVerifier.verifyLogInclusion(proof);
        if (!proven) {
            // Reveal failed verification; leave the dispute open to be resolved by expiry.
            emit ResponseRevealed(disputeId, false);
            return;
        }

        // Indexer proved inclusion: dispute resolves in their favor.
        uint256 counterStake = d.counterStake;
        address disputer = d.disputer;
        address indexer = d.indexer;
        bytes32 regId = d.regId;

        // Effects
        d.state = DisputeState.ResolvedIndexer;
        _closeDispute(indexer, regId);

        // Interactions: return the counter stake to the disputer; no slashing occurs.
        if (counterStake > 0) USDC.safeTransfer(disputer, counterStake);

        emit ResponseRevealed(disputeId, true);
        emit DisputeResolved(disputeId, DisputeState.ResolvedIndexer);
    }

    /// @notice After the dispute window + buffer, anyone can resolve an unanswered dispute
    ///         against the indexer, slashing them and distributing proceeds.
    function resolveExpiredDispute(bytes32 disputeId) external nonReentrantTransient {
        Dispute storage d = disputes[disputeId];
        if (d.openedAt == 0) revert DisputeNotFound();
        if (d.state != DisputeState.Pending && d.state != DisputeState.CommitReceived) revert WrongState();
        if (block.timestamp < uint256(d.openedAt) + DISPUTE_WINDOW_SECS + RESOLUTION_BUFFER) {
            revert WindowNotElapsed();
        }

        address indexer = d.indexer;
        address disputer = d.disputer;
        bytes32 regId = d.regId;
        uint256 counterStake = d.counterStake;

        Registration storage r = registrations[regId];
        IndexerRecord storage rec = indexers[indexer];

        // Slash the full boost (100%).
        uint256 boostSlashed = r.boostStake;

        // Slash 20% of base stake, but only if the base slash cooldown has elapsed.
        uint256 baseSlashed = 0;
        bool baseCooldownPassed =
            uint256(rec.lastSlashAt) + BASE_SLASH_COOLDOWN <= block.timestamp || rec.lastSlashAt == 0;
        if (baseCooldownPassed) {
            baseSlashed = uint256(rec.baseStake) * BASE_SLASH_PCT / BPS_DENOMINATOR;
        }

        // Total proceeds = slashed funds + the disputer's returned counter stake.
        // The counter stake is returned to the disputer in full (they won), and the
        // slashed amount is distributed 70/20/10.
        uint256 proceeds = boostSlashed + baseSlashed;
        uint256 toDisputer = proceeds * 7_000 / BPS_DENOMINATOR;
        uint256 toBuyback = proceeds * 2_000 / BPS_DENOMINATOR;
        uint256 toTreasury = proceeds - toDisputer - toBuyback;

        // ---- Effects ----
        d.state = DisputeState.Expired;

        r.boostStake = 0;
        boostUnlockTime[regId] = 0;
        if (baseSlashed > 0) {
            rec.baseStake = uint128(uint256(rec.baseStake) - baseSlashed);
            rec.lastSlashAt = uint64(block.timestamp);
        }
        if (rec.slashCount < type(uint8).max) rec.slashCount += 1;

        // Disputer won -> reset their multiplier to 1x.
        DisputerRecord storage dr = disputerRecords[disputer];
        dr.multiplier = 1;

        buybackReserveUSDC += toBuyback;

        _closeDispute(indexer, regId);

        // Auto-deregister the registration if it was still live.
        if (r.deregisteredAt == 0) {
            r.deregisteredAt = uint64(block.timestamp);
            if (rec.registrationCount > 0) rec.registrationCount -= 1;
            if (rec.registrationCount == 0) rec.deregisteredAt = uint64(block.timestamp);
        }
        // If base stake fully drained, mark fully wound down.
        if (rec.baseStake == 0) {
            rec.deregisteredAt = uint64(block.timestamp);
        }

        // ---- Interactions ----
        // Return counter stake to the (winning) disputer.
        if (counterStake > 0) USDC.safeTransfer(disputer, counterStake);
        if (toDisputer > 0) USDC.safeTransfer(disputer, toDisputer);
        if (toTreasury > 0) USDC.safeTransfer(TREASURY, toTreasury);
        // toBuyback stays in the contract, tracked by buybackReserveUSDC.

        emit IndexerSlashed(indexer, regId, boostSlashed, baseSlashed, toDisputer, toBuyback, toTreasury);
        emit DisputeResolved(disputeId, DisputeState.Expired);
    }

    /// @dev Decrement open-dispute bookkeeping when a dispute closes.
    function _closeDispute(address indexer, bytes32 regId) internal {
        if (openDisputeCount[indexer] > 0) openDisputeCount[indexer] -= 1;
        regHasOpenDispute[regId] = false;
    }

    // ---------------------------------------------------------------------
    // Buyback
    // ---------------------------------------------------------------------

    /// @notice Swap the accumulated buyback reserve of USDC into CLAWD and burn it.
    /// @param minClawdOut Caller-supplied slippage floor. Combined with an on-chain price
    ///        floor derived from the pool when available.
    function executeBuyback(uint256 minClawdOut) external nonReentrantTransient {
        uint256 usdcIn = buybackReserveUSDC;
        require(usdcIn > 0, "no reserve");

        // Effects: drain the reserve before external calls.
        buybackReserveUSDC = 0;

        // Derive an on-chain price floor. Prefer TWAP via observe(); fall back to slot0;
        // if neither is available, rely solely on the caller's minClawdOut.
        uint256 priceFloor = _priceFloor(usdcIn);
        uint256 effectiveMin = minClawdOut;
        if (priceFloor > effectiveMin) effectiveMin = priceFloor;

        // Interactions: approve and swap.
        USDC.forceApprove(address(UNISWAP_V3_ROUTER), usdcIn);

        uint256 clawdBefore = CLAWD.balanceOf(address(this));
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(USDC),
            tokenOut: address(CLAWD),
            fee: POOL_FEE,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: usdcIn,
            amountOutMinimum: effectiveMin,
            sqrtPriceLimitX96: 0
        });
        UNISWAP_V3_ROUTER.exactInputSingle(params);
        uint256 clawdReceived = CLAWD.balanceOf(address(this)) - clawdBefore;

        // Clear any residual approval.
        USDC.forceApprove(address(UNISWAP_V3_ROUTER), 0);

        // Burn everything received to the dead address.
        if (clawdReceived > 0) CLAWD.safeTransfer(BURN_ADDRESS, clawdReceived);

        emit BuybackExecuted(usdcIn, clawdReceived, priceFloor);
    }

    /// @dev Compute an on-chain minimum-CLAWD-out floor for `usdcIn`. Tries the 2h TWAP
    ///      first; on failure falls back to current slot0 price; returns 0 if both fail,
    ///      meaning the caller's own minClawdOut governs.
    function _priceFloor(uint256 usdcIn) internal view returns (uint256) {
        // Try TWAP via observe([TWAP_WINDOW, 0]).
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = uint32(TWAP_WINDOW);
        secondsAgos[1] = 0;
        try CLAWD_USDC_V3_POOL.observe(secondsAgos) returns (
            int56[] memory tickCumulatives, uint160[] memory
        ) {
            int56 tickCumDelta = tickCumulatives[1] - tickCumulatives[0];
            int24 avgTick = int24(tickCumDelta / int56(uint56(TWAP_WINDOW)));
            uint160 sqrtPriceX96 = _sqrtRatioFromTickApprox(avgTick);
            if (sqrtPriceX96 == 0) return _slot0Floor(usdcIn);
            return _floorFromSqrtPrice(sqrtPriceX96, usdcIn);
        } catch {
            return _slot0Floor(usdcIn);
        }
    }

    /// @dev Fall back to the pool's current spot price for the floor.
    function _slot0Floor(uint256 usdcIn) internal view returns (uint256) {
        try CLAWD_USDC_V3_POOL.slot0() returns (
            uint160 sqrtPriceX96, int24, uint16, uint16, uint16, uint8, bool
        ) {
            if (sqrtPriceX96 == 0) return 0;
            return _floorFromSqrtPrice(sqrtPriceX96, usdcIn);
        } catch {
            return 0;
        }
    }

    /**
     * @dev Convert a sqrtPriceX96 into a minimum CLAWD-out floor for `usdcIn` USDC.
     *
     * Token ordering on Base: USDC (0x8335...) < CLAWD (0x9f86...), so USDC is token0 and
     * CLAWD is token1. In Uniswap V3, price = (sqrtPriceX96 / 2^96)^2 expresses token1 per
     * token0 in raw units, i.e. raw CLAWD per raw USDC. Both decimals cancel into the raw
     * ratio, so:
     *
     *   clawdOut(raw) = usdcIn(raw) * sqrtPriceX96^2 / 2^192
     *
     * We then apply a 1% safety margin (x99/100) to absorb rounding and minor drift.
     * Overflow is avoided by splitting the multiplication: sqrtPriceX96 is at most 2^160,
     * so sqrtPriceX96^2 is at most 2^320 — we therefore stage the math with the
     * mulDiv-style decomposition (a * b / 2^192) using two >> 96 shifts.
     */
    function _floorFromSqrtPrice(uint160 sqrtPriceX96, uint256 usdcIn) internal pure returns (uint256) {
        // priceX96 = sqrtPriceX96^2 / 2^96  (Q96 representation of raw CLAWD per raw USDC)
        // To avoid overflow on sqrtPriceX96^2 we first reduce one factor by >> 96.
        uint256 sp = uint256(sqrtPriceX96);
        // ratio = sp^2 >> 192 would lose precision for small prices; instead compute
        // (sp >> 48)^2 >> 96 to keep within 256 bits while preserving scale.
        uint256 half = sp >> 48; // <= 2^112
        uint256 priceQ96 = (half * half) >> 0; // (sp/2^48)^2 = sp^2 / 2^96, this is sp^2 >> 96
        // priceQ96 now ~ sp^2 / 2^96. CLAWD per USDC (raw) = priceQ96 / 2^96.
        // clawdOut = usdcIn * priceQ96 / 2^96
        uint256 out = (usdcIn * priceQ96) >> 96;
        // 1% safety margin.
        return out * 99 / 100;
    }

    /**
     * @dev Approximate sqrtRatioAtTick without importing full TickMath. For ticks within
     *      a sane band we reconstruct sqrtPriceX96 ≈ 1.0001^(tick/2) * 2^96 using a binary
     *      decomposition of |tick| over precomputed Q128.128 ratios (the standard Uniswap
     *      TickMath constants). Returns 0 for out-of-band ticks so callers fall back to
     *      slot0 / caller-supplied min.
     */
    function _sqrtRatioFromTickApprox(int24 tick) internal pure returns (uint160) {
        // Bound to Uniswap's valid tick range.
        if (tick < -887272 || tick > 887272) return 0;

        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));

        // Standard Uniswap V3 TickMath ratios (1/sqrt(1.0001)^(2^i) in Q128.128).
        uint256 ratio = absTick & 0x1 != 0 ? 0xfffcb933bd6fad37aa2d162d1a594001 : 0x100000000000000000000000000000000;
        if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
        if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
        if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
        if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
        if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
        if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
        if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
        if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
        if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
        if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
        if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
        if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
        if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
        if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
        if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;

        // ratio is currently 1/sqrt(1.0001)^tick for the original (negative-exponent)
        // constants. For positive ticks we invert.
        if (tick > 0) ratio = type(uint256).max / ratio;

        // Convert Q128.128 -> Q96 (sqrtPriceX96). Round up the last 32 bits.
        uint160 sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
        return sqrtPriceX96;
    }

    // ---------------------------------------------------------------------
    // Misc
    // ---------------------------------------------------------------------

    /// @notice Rescue non-USDC tokens accidentally sent to the contract, to the treasury.
    function rescueToken(address token) external nonReentrantTransient {
        if (token == address(USDC)) revert CannotRescueUSDC();
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal > 0) IERC20(token).safeTransfer(TREASURY, bal);
        emit TokenRescued(token, bal);
    }
}
