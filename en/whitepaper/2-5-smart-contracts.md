# 2.5 Smart Contract Design

The smart contract design of the TW Protocol follows modular principles. Below shows the core contract interfaces and their functions.

## 2.5.1 Main Contract Interface: AIProxyManager

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IAIProxyManager {
    // Data structure definition
    struct AgentState {
        address owner;         // Owner of the AI agent
        uint256 lastAction;    // Timestamp of last action
        uint256 rewardBalance; // Reward balance for running the agent
        bytes32 proofHash;     // Verification hash
        uint256 entropy;       // Action entropy statistics
    }

    // Event definitions
    event AgentRegistered(address indexed owner, bytes32 proofHash);
    event ActionSubmitted(address indexed owner, bytes32 actionHash);
    event RewardWithdrawn(address indexed owner, uint256 amount);

    // Core function interfaces
    function registerAgent(address agentOwner, bytes32 proofHash) external;

    function submitAction(
        address agentOwner,
        bytes memory actionData,
        bytes memory signature,
        bytes memory entropyProof
    ) external;

    function withdrawReward(address agentOwner) external;

    // Query interfaces
    function getAgentState(address agentOwner) external view returns (AgentState memory);
    function isActionValid(bytes memory actionData, uint256 lastActionTime) external view returns (bool);
    function calculateReward(bytes memory actionData) external view returns (uint256);
}
```

## 2.5.2 Auxiliary Contract Interface: Verifier Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IActionVerifier {
    // Verify action signature
    function verifySignature(
        address signer,
        bytes memory data,
        bytes memory signature
    ) external view returns (bool);

    // Verify action compliance
    function verifyAction(
        bytes memory actionData,
        address character,
        uint256 timestamp
    ) external view returns (bool);

    // Verify action entropy
    function verifyEntropy(
        address agent,
        bytes memory entropyProof,
        uint256 minEntropy
    ) external view returns (bool);
}
```

## 2.5.3 Core Contract Functions

The smart contract system of the TW Protocol implements the following key functions:

1. **Agent Registration**:
   - Players register their local AI agents
   - Associate agents with player identities
   - Initialize agent states

2. **Action Submission and Verification**:
   - Receive actions generated and signed by AI agents
   - Verify the authenticity of action signatures
   - Verify actions comply with game rules
   - Verify actions match character states

3. **Reward Calculation and Distribution**:
   - Calculate rewards based on valid actions
   - Distribute rewards to agent owners
   - Support reward withdrawal functionality

4. **Agent State Management**:
   - Record agent's historical actions
   - Maintain agent's entropy statistics
   - Update agent's latest state

## 2.5.4 Contract Design Principles

The smart contract design of the TW Protocol follows these principles:

1. **Modular Design**:
   - Separate functions into independent contracts
   - Interact through interfaces
   - Support contract upgrades and extensions

2. **Security First**:
   - Strict access control
   - Prevent reentrancy attacks
   - Comprehensive parameter validation

3. **Gas Optimization**:
   - Minimize storage operations
   - Optimize computation logic
   - Batch processing mechanism

4. **Interoperability**:
   - Standardized interface design
   - Compatible with cross-chain bridging
   - Support multiple token standards

This interface design provides sufficient extensibility and modularity while ensuring reliable implementation of the TW Protocol's core functions. The contract system has undergone rigorous security audits and testing to ensure its safety and stability under various conditions.
