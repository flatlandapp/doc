# 2.5 智能合约设计

TW 协议的智能合约设计遵循模块化原则，以下展示核心合约接口及其功能。

## 2.5.1 主合约接口：AIProxyManager

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

## 2.5.2 辅助合约接口：验证器接口

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
