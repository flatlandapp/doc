# 3.5 智能合约设计

TLF 协议的智能合约设计模块化、高效，以下是核心合约接口和功能介绍。

## 3.5.1 主合约接口：EventGovernance

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IEventGovernance {
    // 数据结构
    struct Event {
        uint256 id;              // 事件ID
        address creator;         // 创建者
        string contentHash;      // 内容哈希（IPFS）
        uint256 startTime;       // 投票开始时间
        uint256 endTime;         // 投票结束时间
        uint256 positiveVotes;   // 正向票数
        uint256 negativeVotes;   // 负向票数
        bool executed;           // 是否已执行
        EventStatus status;      // 事件状态
    }

    enum EventStatus { Proposed, Voting, Approved, Rejected, Executed, Expired }

    // 事件定义
    event EventProposed(uint256 indexed eventId, address indexed creator, string contentHash);
    event VoteCast(uint256 indexed eventId, address indexed voter, int256 value);
    event EventStatusChanged(uint256 indexed eventId, EventStatus status);
    event EventExecuted(uint256 indexed eventId);

    // 核心功能
    function proposeEvent(string calldata contentHash) external returns (uint256 eventId);
    function castVote(uint256 eventId, int256 voteValue) external;
    function executeEvent(uint256 eventId) external;
    function cancelEvent(uint256 eventId) external;

    // 查询功能
    function getEvent(uint256 eventId) external view returns (Event memory);
    function getVoterWeight(address voter) external view returns (uint256);
    function getVoterVote(uint256 eventId, address voter) external view returns (int256);
    function getActiveEvents() external view returns (uint256[] memory);
}
```

## 3.5.2 辅助合约接口：StakingRegistry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakingRegistry {
    struct StakeInfo {
        uint256 amount;        // 质押数量
        uint256 startTime;     // 质押开始时间
        uint256 lockPeriod;    // 锁定期（天）
    }

    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    // 质押功能
    function stake(uint256 amount, uint256 lockPeriod) external;
    function unstake(uint256 amount) external;
    function claimRewards() external;

    // 查询功能
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    function calculateVotingPower(address user) external view returns (uint256);
    function getTotalStaked() external view returns (uint256);
}
```

## 3.5.3 辅助合约接口：EventExecutor

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IEventExecutor {
    struct ExecutionResult {
        bool success;           // 执行是否成功
        bytes resultData;       // 执行结果数据
        uint256 timestamp;      // 执行时间戳
        uint256[] affectedIds;  // 受影响的游戏对象ID
    }

    event EventExecutionSuccess(uint256 indexed eventId, uint256 timestamp);
    event EventExecutionFailed(uint256 indexed eventId, string reason);

    // 执行功能
    function executeEvent(uint256 eventId, bytes calldata executionParams) external returns (ExecutionResult memory);
    function validateExecution(uint256 eventId, bytes calldata executionParams) external view returns (bool valid, string memory reason);

    // 查询功能
    function getExecutionResult(uint256 eventId) external view returns (ExecutionResult memory);
    function getPendingExecutions() external view returns (uint256[] memory);
}
```

## 3.5.4 核心功能流程

TLF 协议的智能合约系统支持以下核心流程：

### 事件提案和管理流程

1. **事件提案**：
   - 创建者设计事件内容并上传到 IPFS
   - 调用 `proposeEvent` 提交事件提案
   - 系统为事件分配唯一 ID 并设置投票期

2. **投票过程**：
   - 质押者调用 `castVote` 对事件投票
   - 系统根据质押量和时长计算投票权重
   - 投票结果实时累计并可公开查询

3. **事件执行**：
   - 投票期结束后，系统评估投票结果
   - 达到执行阈值的事件可调用 `executeEvent` 执行
   - `EventExecutor` 合约负责实际执行事件逻辑

4. **结果反馈**：
   - 执行结果上链存储，确保透明性
   - 事件执行结果会影响游戏世界状态
   - 执行结果可能触发新的事件候选

### 质押与投票权重

1. **代币质押**：
   - 用户调用 `stake` 质押代币
   - 可选择不同的锁定期获得权重加成
   - 获得与质押量和时长相关的投票权

2. **投票权计算**：
   - 基础投票权与质押量成正比
   - 长期质押获得时间加成
   - 二次投票机制减轻资本优势

3. **奖励分配**：
   - 投票与多数一致的质押者获得额外奖励
   - 被采纳事件的创建者获得创作奖励
   - 长期参与质押者获得基础收益

## 3.5.5 合约设计原则

TLF 协议的智能合约设计遵循以下关键原则：

1. **模块化设计**：
   - 功能分离到不同合约
   - 通过接口实现松耦合
   - 支持组件单独升级

2. **安全优先**：
   - 严格的访问控制
   - 防重入保护
   - 时间锁定关键操作

3. **可扩展性**：
   - 支持未来功能的平滑添加
   - 透明的升级路径
   - 版本控制机制

4. **经济安全**：
   - 防止投票操纵
   - 激励机制的博弈论平衡
   - 动态调整的系统参数

这些智能合约共同构成了 TLF 协议的去中心化治理基础设施，确保事件治理过程的透明、公平和高效，同时支持游戏世界的持续演化。
