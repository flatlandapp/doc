# 2.5 智能合约设计

TW 协议的智能合约设计遵循模块化原则，以下展示核心合约接口及其功能，提供多种编程语言的实现。

## 2.5.1 主合约接口：AIProxyManager

### Solidity 实现
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IAIProxyManager {
    // 数据结构定义
    struct AgentState {
        address owner;         // AI代理的所有者
        uint256 lastAction;    // 上次行为的时间戳
        uint256 rewardBalance; // 玩家运行代理的奖励余额
        bytes32 proofHash;     // 验证哈希
        uint256 entropy;       // 行为熵统计
    }

    // 事件定义
    event AgentRegistered(address indexed owner, bytes32 proofHash);
    event ActionSubmitted(address indexed owner, bytes32 actionHash);
    event RewardWithdrawn(address indexed owner, uint256 amount);

    // 核心功能接口
    function registerAgent(address agentOwner, bytes32 proofHash) external;

    function submitAction(
        address agentOwner,
        bytes memory actionData,
        bytes memory signature,
        bytes memory entropyProof
    ) external;

    function withdrawReward(address agentOwner) external;

    // 查询接口
    function getAgentState(address agentOwner) external view returns (AgentState memory);
    function isActionValid(bytes memory actionData, uint256 lastActionTime) external view returns (bool);
    function calculateReward(bytes memory actionData) external view returns (uint256);
}
```

### Rust 实现
```rust
// AIProxyManager 接口的 Rust 版本

use ethers::types::{Address, Bytes, H256, U256};

#[derive(Debug, Clone)]
pub struct AgentState {
    pub owner: Address,         // AI代理的所有者
    pub last_action: U256,      // 上次行为的时间戳
    pub reward_balance: U256,   // 玩家运行代理的奖励余额
    pub proof_hash: H256,       // 验证哈希
    pub entropy: U256,          // 行为熵统计
}

pub trait AIProxyManager {
    // 核心功能接口
    fn register_agent(&mut self, agent_owner: Address, proof_hash: H256) -> Result<(), String>;

    fn submit_action(
        &mut self,
        agent_owner: Address,
        action_data: Bytes,
        signature: Bytes,
        entropy_proof: Bytes
    ) -> Result<(), String>;

    fn withdraw_reward(&mut self, agent_owner: Address) -> Result<(), String>;

    // 查询接口
    fn get_agent_state(&self, agent_owner: Address) -> Option<AgentState>;
    fn is_action_valid(&self, action_data: Bytes, last_action_time: U256) -> bool;
    fn calculate_reward(&self, action_data: Bytes) -> U256;
}
```

### C++ 实现
```cpp
// AIProxyManager 接口的 C++ 版本

#include <string>
#include <vector>
#include <optional>
#include <array>
#include <cstdint>

using Address = std::array<uint8_t, 20>;
using Hash = std::array<uint8_t, 32>;
using Bytes = std::vector<uint8_t>;

struct AgentState {
    Address owner;           // AI代理的所有者
    uint64_t lastAction;     // 上次行为的时间戳
    uint64_t rewardBalance;  // 玩家运行代理的奖励余额
    Hash proofHash;          // 验证哈希
    uint64_t entropy;        // 行为熵统计
};

class IAIProxyManager {
public:
    virtual ~IAIProxyManager() = default;

    // 核心功能接口
    virtual void registerAgent(const Address& agentOwner, const Hash& proofHash) = 0;

    virtual void submitAction(
        const Address& agentOwner,
        const Bytes& actionData,
        const Bytes& signature,
        const Bytes& entropyProof
    ) = 0;

    virtual void withdrawReward(const Address& agentOwner) = 0;

    // 查询接口
    virtual std::optional<AgentState> getAgentState(const Address& agentOwner) const = 0;
    virtual bool isActionValid(const Bytes& actionData, uint64_t lastActionTime) const = 0;
    virtual uint64_t calculateReward(const Bytes& actionData) const = 0;
};
```

## 2.5.2 辅助合约接口：验证器接口

### Solidity 实现
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IActionVerifier {
    // 验证行为签名
    function verifySignature(
        address signer,
        bytes memory data,
        bytes memory signature
    ) external view returns (bool);

    // 验证行为合规性
    function verifyAction(
        bytes memory actionData,
        address character,
        uint256 timestamp
    ) external view returns (bool);

    // 验证行为熵
    function verifyEntropy(
        address agent,
        bytes memory entropyProof,
        uint256 minEntropy
    ) external view returns (bool);
}
```

### Rust 实现
```rust
// 行为验证器接口的 Rust 版本

use ethers::types::{Address, Bytes, U256};

pub trait ActionVerifier {
    // 验证行为签名
    fn verify_signature(
        &self,
        signer: Address,
        data: Bytes,
        signature: Bytes
    ) -> bool;

    // 验证行为合规性
    fn verify_action(
        &self,
        action_data: Bytes,
        character: Address,
        timestamp: U256
    ) -> bool;

    // 验证行为熵
    fn verify_entropy(
        &self,
        agent: Address,
        entropy_proof: Bytes,
        min_entropy: U256
    ) -> bool;
}
```

### C++ 实现
```cpp
// 行为验证器接口的 C++ 版本

#include <vector>
#include <array>
#include <cstdint>

using Address = std::array<uint8_t, 20>;
using Bytes = std::vector<uint8_t>;

class IActionVerifier {
public:
    virtual ~IActionVerifier() = default;

    // 验证行为签名
    virtual bool verifySignature(
        const Address& signer,
        const Bytes& data,
        const Bytes& signature
    ) const = 0;

    // 验证行为合规性
    virtual bool verifyAction(
        const Bytes& actionData,
        const Address& character,
        uint64_t timestamp
    ) const = 0;

    // 验证行为熵
    virtual bool verifyEntropy(
        const Address& agent,
        const Bytes& entropyProof,
        uint64_t minEntropy
    ) const = 0;
};
```

## 2.5.3 核心合约功能

TW 协议的智能合约系统实现了以下关键功能：

1. **代理注册**：
   - 玩家注册其本地AI代理
   - 关联代理与玩家身份
   - 初始化代理状态

2. **行为提交与验证**：
   - 接收由AI代理生成并签名的行为
   - 验证行为的签名真实性
   - 验证行为符合游戏规则
   - 验证行为与角色状态一致

3. **奖励计算与分配**：
   - 基于有效行为计算奖励
   - 将奖励分配给代理所有者
   - 支持奖励提取功能

4. **代理状态管理**：
   - 记录代理的历史行为
   - 维护代理的熵统计
   - 更新代理的最新状态

## 2.5.4 合约设计原则

TW 协议的智能合约设计遵循以下原则：

1. **模块化设计**：
   - 功能分离为独立合约
   - 通过接口进行交互
   - 支持合约升级与扩展

2. **安全优先**：
   - 严格的访问控制
   - 防止重入攻击
   - 全面的参数验证

3. **气体优化**：
   - 最小化存储操作
   - 优化计算逻辑
   - 批处理处理机制

4. **互操作性**：
   - 标准化接口设计
   - 兼容跨链桥接
   - 支持多种代币标准

这种接口设计提供了足够的扩展性和模块化，同时确保了TW协议的核心功能能够可靠实现。合约系统经过严格的安全审计和测试，确保其在各种条件下的安全性和稳定性。
