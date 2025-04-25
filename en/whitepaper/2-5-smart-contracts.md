# 2.5 Smart Contract Design

The smart contract design of the TW Protocol follows modular principles. Below shows the core contract interfaces and their functions in multiple programming languages.

## 2.5.1 Main Contract Interface: AIProxyManager

### Solidity Implementation
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

### Rust Implementation
```rust
// Rust version of the AIProxyManager interface

use ethers::types::{Address, Bytes, H256, U256};

#[derive(Debug, Clone)]
pub struct AgentState {
    pub owner: Address,         // Owner of the AI agent
    pub last_action: U256,      // Timestamp of last action
    pub reward_balance: U256,   // Reward balance for running the agent
    pub proof_hash: H256,       // Verification hash
    pub entropy: U256,          // Action entropy statistics
}

pub trait AIProxyManager {
    // Core function interfaces
    fn register_agent(&mut self, agent_owner: Address, proof_hash: H256) -> Result<(), String>;

    fn submit_action(
        &mut self,
        agent_owner: Address,
        action_data: Bytes,
        signature: Bytes,
        entropy_proof: Bytes
    ) -> Result<(), String>;

    fn withdraw_reward(&mut self, agent_owner: Address) -> Result<(), String>;

    // Query interfaces
    fn get_agent_state(&self, agent_owner: Address) -> Option<AgentState>;
    fn is_action_valid(&self, action_data: Bytes, last_action_time: U256) -> bool;
    fn calculate_reward(&self, action_data: Bytes) -> U256;
}
```

### C++ Implementation
```cpp
// C++ version of the AIProxyManager interface

#include <string>
#include <vector>
#include <optional>
#include <array>
#include <cstdint>

using Address = std::array<uint8_t, 20>;
using Hash = std::array<uint8_t, 32>;
using Bytes = std::vector<uint8_t>;

struct AgentState {
    Address owner;           // Owner of the AI agent
    uint64_t lastAction;     // Timestamp of last action
    uint64_t rewardBalance;  // Reward balance for running the agent
    Hash proofHash;          // Verification hash
    uint64_t entropy;        // Action entropy statistics
};

class IAIProxyManager {
public:
    virtual ~IAIProxyManager() = default;

    // Core function interfaces
    virtual void registerAgent(const Address& agentOwner, const Hash& proofHash) = 0;

    virtual void submitAction(
        const Address& agentOwner,
        const Bytes& actionData,
        const Bytes& signature,
        const Bytes& entropyProof
    ) = 0;

    virtual void withdrawReward(const Address& agentOwner) = 0;

    // Query interfaces
    virtual std::optional<AgentState> getAgentState(const Address& agentOwner) const = 0;
    virtual bool isActionValid(const Bytes& actionData, uint64_t lastActionTime) const = 0;
    virtual uint64_t calculateReward(const Bytes& actionData) const = 0;
};
```

## 2.5.2 Auxiliary Contract Interface: Verifier Interface

### Solidity Implementation
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

### Rust Implementation
```rust
// Rust version of the ActionVerifier interface

use ethers::types::{Address, Bytes, U256};

pub trait ActionVerifier {
    // Verify action signature
    fn verify_signature(
        &self,
        signer: Address,
        data: Bytes,
        signature: Bytes
    ) -> bool;

    // Verify action compliance
    fn verify_action(
        &self,
        action_data: Bytes,
        character: Address,
        timestamp: U256
    ) -> bool;

    // Verify action entropy
    fn verify_entropy(
        &self,
        agent: Address,
        entropy_proof: Bytes,
        min_entropy: U256
    ) -> bool;
}
```

### C++ Implementation
```cpp
// C++ version of the ActionVerifier interface

#include <vector>
#include <array>
#include <cstdint>

using Address = std::array<uint8_t, 20>;
using Bytes = std::vector<uint8_t>;

class IActionVerifier {
public:
    virtual ~IActionVerifier() = default;

    // Verify action signature
    virtual bool verifySignature(
        const Address& signer,
        const Bytes& data,
        const Bytes& signature
    ) const = 0;

    // Verify action compliance
    virtual bool verifyAction(
        const Bytes& actionData,
        const Address& character,
        uint64_t timestamp
    ) const = 0;

    // Verify action entropy
    virtual bool verifyEntropy(
        const Address& agent,
        const Bytes& entropyProof,
        uint64_t minEntropy
    ) const = 0;
};
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
