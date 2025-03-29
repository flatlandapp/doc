# 3.5 Smart Contract Design

The TLF protocol's smart contract design is modular and efficient. Here are the core contract interfaces and features.

## 3.5.1 Main Contract Interface: EventGovernance

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IEventGovernance {
    // Data structure
    struct Event {
        uint256 id;              // Event ID
        address creator;         // Creator
        string contentHash;      // Content hash (IPFS)
        uint256 startTime;       // Voting start time
        uint256 endTime;         // Voting end time
        uint256 positiveVotes;   // Positive votes
        uint256 negativeVotes;   // Negative votes
        bool executed;           // Whether executed
        EventStatus status;      // Event status
    }

    enum EventStatus { Proposed, Voting, Approved, Rejected, Executed, Expired }

    // Event definitions
    event EventProposed(uint256 indexed eventId, address indexed creator, string contentHash);
    event VoteCast(uint256 indexed eventId, address indexed voter, int256 value);
    event EventStatusChanged(uint256 indexed eventId, EventStatus status);
    event EventExecuted(uint256 indexed eventId);

    // Core functions
    function proposeEvent(string calldata contentHash) external returns (uint256 eventId);
    function castVote(uint256 eventId, int256 voteValue) external;
    function executeEvent(uint256 eventId) external;
    function cancelEvent(uint256 eventId) external;

    // Query functions
    function getEvent(uint256 eventId) external view returns (Event memory);
    function getVoterWeight(address voter) external view returns (uint256);
    function getVoterVote(uint256 eventId, address voter) external view returns (int256);
    function getActiveEvents() external view returns (uint256[] memory);
}
```

## 3.5.2 Auxiliary Contract Interface: StakingRegistry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakingRegistry {
    struct StakeInfo {
        uint256 amount;        // Staked amount
        uint256 startTime;     // Staking start time
        uint256 lockPeriod;    // Lock period (days)
    }

    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    // Staking functions
    function stake(uint256 amount, uint256 lockPeriod) external;
    function unstake(uint256 amount) external;
    function claimRewards() external;

    // Query functions
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    function calculateVotingPower(address user) external view returns (uint256);
    function getTotalStaked() external view returns (uint256);
}
```

## 3.5.3 Auxiliary Contract Interface: EventExecutor

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IEventExecutor {
    struct ExecutionResult {
        bool success;           // Whether execution succeeded
        bytes resultData;       // Execution result data
        uint256 timestamp;      // Execution timestamp
        uint256[] affectedIds;  // Affected game object IDs
    }

    event EventExecutionSuccess(uint256 indexed eventId, uint256 timestamp);
    event EventExecutionFailed(uint256 indexed eventId, string reason);

    // Execution functions
    function executeEvent(uint256 eventId, bytes calldata executionParams) external returns (ExecutionResult memory);
    function validateExecution(uint256 eventId, bytes calldata executionParams) external view returns (bool valid, string memory reason);

    // Query functions
    function getExecutionResult(uint256 eventId) external view returns (ExecutionResult memory);
    function getPendingExecutions() external view returns (uint256[] memory);
}
```

## 3.5.4 Core Process Flow

The TLF protocol's smart contract system supports the following core processes:

### Event Proposal and Management Process

1. **Event Proposal**:
   - Creator designs event content and uploads to IPFS
   - Calls `proposeEvent` to submit event proposal
   - System assigns unique ID and sets voting period

2. **Voting Process**:
   - Stakers call `castVote` to vote on events
   - System calculates voting weight based on stake amount and duration
   - Voting results are accumulated in real-time and can be publicly queried

3. **Event Execution**:
   - After voting period ends, system evaluates voting results
   - Events meeting execution threshold can be executed by calling `executeEvent`
   - `EventExecutor` contract handles actual event logic execution

4. **Result Feedback**:
   - Execution results are stored on-chain for transparency
   - Event execution results affect game world state
   - Execution results may trigger new event candidates

### Staking and Voting Weight

1. **Token Staking**:
   - Users call `stake` to stake tokens
   - Can choose different lock periods for weight bonuses
   - Gain voting power proportional to stake amount and duration

2. **Voting Power Calculation**:
   - Base voting power proportional to stake amount
   - Long-term staking receives time bonus
   - Quadratic voting mechanism reduces capital advantage

3. **Reward Distribution**:
   - Stakers voting with majority receive additional rewards
   - Creators of adopted events receive creation rewards
   - Long-term participants receive base rewards

## 3.5.5 Contract Design Principles

The TLF protocol's smart contract design follows these key principles:

1. **Modular Design**:
   - Functional separation into different contracts
   - Loose coupling through interfaces
   - Support for individual component upgrades

2. **Security First**:
   - Strict access control
   - Reentrancy protection
   - Time locks for critical operations

3. **Scalability**:
   - Support for smooth addition of future features
   - Transparent upgrade paths
   - Version control mechanisms

4. **Economic Security**:
   - Prevention of voting manipulation
   - Game-theoretic balance of incentive mechanisms
   - Dynamically adjustable system parameters

These smart contracts together form the decentralized governance infrastructure of the TLF protocol, ensuring transparency, fairness, and efficiency in the event governance process, while supporting the continuous evolution of the game world.
