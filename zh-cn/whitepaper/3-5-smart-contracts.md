# 3.5 智能合约设计

TLF 协议的智能合约设计模块化、高效，以下是核心合约接口和功能介绍。

## 3.5.1 主合约接口：EventGovernance

### Solidity 实现
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

### Rust 实现
```rust
// Rust版本的事件治理接口

#[derive(Debug, Clone, PartialEq)]
pub enum EventStatus {
    Proposed,
    Voting,
    Approved,
    Rejected,
    Executed,
    Expired,
}

#[derive(Debug, Clone)]
pub struct Event {
    pub id: u64,                // 事件ID
    pub creator: String,        // 创建者地址
    pub content_hash: String,   // 内容哈希（IPFS）
    pub start_time: u64,        // 投票开始时间
    pub end_time: u64,          // 投票结束时间
    pub positive_votes: u64,    // 正向票数
    pub negative_votes: u64,    // 负向票数
    pub executed: bool,         // 是否已执行
    pub status: EventStatus,    // 事件状态
}

// 事件相关的trait
pub trait EventGovernance {
    // 核心功能
    fn propose_event(&mut self, content_hash: String) -> Result<u64, String>;
    fn cast_vote(&mut self, event_id: u64, vote_value: i64) -> Result<(), String>;
    fn execute_event(&mut self, event_id: u64) -> Result<(), String>;
    fn cancel_event(&mut self, event_id: u64) -> Result<(), String>;

    // 查询功能
    fn get_event(&self, event_id: u64) -> Option<Event>;
    fn get_voter_weight(&self, voter: &str) -> u64;
    fn get_voter_vote(&self, event_id: u64, voter: &str) -> i64;
    fn get_active_events(&self) -> Vec<u64>;
}
```

### C++ 实现
```cpp
// C++版本的事件治理接口

#include <string>
#include <vector>
#include <optional>
#include <cstdint>

enum class EventStatus {
    Proposed,
    Voting,
    Approved,
    Rejected,
    Executed,
    Expired
};

struct Event {
    uint64_t id;                // 事件ID
    std::string creator;        // 创建者地址
    std::string contentHash;    // 内容哈希（IPFS）
    uint64_t startTime;         // 投票开始时间
    uint64_t endTime;           // 投票结束时间
    uint64_t positiveVotes;     // 正向票数
    uint64_t negativeVotes;     // 负向票数
    bool executed;              // 是否已执行
    EventStatus status;         // 事件状态
};

class IEventGovernance {
public:
    virtual ~IEventGovernance() = default;

    // 核心功能
    virtual uint64_t proposeEvent(const std::string& contentHash) = 0;
    virtual void castVote(uint64_t eventId, int64_t voteValue) = 0;
    virtual void executeEvent(uint64_t eventId) = 0;
    virtual void cancelEvent(uint64_t eventId) = 0;

    // 查询功能
    virtual std::optional<Event> getEvent(uint64_t eventId) const = 0;
    virtual uint64_t getVoterWeight(const std::string& voter) const = 0;
    virtual int64_t getVoterVote(uint64_t eventId, const std::string& voter) const = 0;
    virtual std::vector<uint64_t> getActiveEvents() const = 0;
};
```

## 3.5.2 辅助合约接口：StakingRegistry

### Solidity 实现
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

### Rust 实现
```rust
// Rust版本的质押注册接口

#[derive(Debug, Clone)]
pub struct StakeInfo {
    pub amount: u64,        // 质押数量
    pub start_time: u64,    // 质押开始时间
    pub lock_period: u64,   // 锁定期（天）
}

pub trait StakingRegistry {
    // 质押功能
    fn stake(&mut self, amount: u64, lock_period: u64) -> Result<(), String>;
    fn unstake(&mut self, amount: u64) -> Result<(), String>;
    fn claim_rewards(&mut self) -> Result<u64, String>;

    // 查询功能
    fn get_stake_info(&self, user: &str) -> Option<StakeInfo>;
    fn calculate_voting_power(&self, user: &str) -> u64;
    fn get_total_staked(&self) -> u64;
}
```

### C++ 实现
```cpp
// C++版本的质押注册接口

#include <string>
#include <optional>
#include <cstdint>

struct StakeInfo {
    uint64_t amount;        // 质押数量
    uint64_t startTime;     // 质押开始时间
    uint64_t lockPeriod;    // 锁定期（天）
};

class IStakingRegistry {
public:
    virtual ~IStakingRegistry() = default;

    // 质押功能
    virtual void stake(uint64_t amount, uint64_t lockPeriod) = 0;
    virtual void unstake(uint64_t amount) = 0;
    virtual void claimRewards() = 0;

    // 查询功能
    virtual std::optional<StakeInfo> getStakeInfo(const std::string& user) const = 0;
    virtual uint64_t calculateVotingPower(const std::string& user) const = 0;
    virtual uint64_t getTotalStaked() const = 0;
};
```

## 3.5.3 辅助合约接口：EventExecutor

### Solidity 实现
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

### Rust 实现
```rust
// Rust版本的事件执行器接口

#[derive(Debug, Clone)]
pub struct ExecutionResult {
    pub success: bool,           // 执行是否成功
    pub result_data: Vec<u8>,    // 执行结果数据
    pub timestamp: u64,          // 执行时间戳
    pub affected_ids: Vec<u64>,  // 受影响的游戏对象ID
}

pub trait EventExecutor {
    // 执行功能
    fn execute_event(&mut self, event_id: u64, execution_params: &[u8]) -> Result<ExecutionResult, String>;
    fn validate_execution(&self, event_id: u64, execution_params: &[u8]) -> Result<bool, String>;

    // 查询功能
    fn get_execution_result(&self, event_id: u64) -> Option<ExecutionResult>;
    fn get_pending_executions(&self) -> Vec<u64>;
}
```

### C++ 实现
```cpp
// C++版本的事件执行器接口

#include <string>
#include <vector>
#include <optional>
#include <cstdint>

struct ExecutionResult {
    bool success;                    // 执行是否成功
    std::vector<uint8_t> resultData; // 执行结果数据
    uint64_t timestamp;              // 执行时间戳
    std::vector<uint64_t> affectedIds; // 受影响的游戏对象ID
};

class IEventExecutor {
public:
    virtual ~IEventExecutor() = default;

    // 执行功能
    virtual ExecutionResult executeEvent(uint64_t eventId, const std::vector<uint8_t>& executionParams) = 0;
    virtual std::pair<bool, std::string> validateExecution(uint64_t eventId, const std::vector<uint8_t>& executionParams) const = 0;

    // 查询功能
    virtual std::optional<ExecutionResult> getExecutionResult(uint64_t eventId) const = 0;
    virtual std::vector<uint64_t> getPendingExecutions() const = 0;
};
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
