/**
 * Flatland AI代理系统
 * 基于角色属性和环境实现自主行为和决策
 */

// 决策类型枚举
const DECISION_TYPE = {
  MOVE: 'move',               // 移动
  INTERACT: 'interact',       // 与其他角色互动
  MIGRATE: 'migrate',         // 迁移到其他小镇
  PARTICIPATE: 'participate', // 参与事件
  IDLE: 'idle'                // 空闲
};

// 行为倾向枚举
const BEHAVIOR_TENDENCY = {
  COOPERATIVE: 'cooperative', // 合作倾向
  COMPETITIVE: 'competitive', // 竞争倾向
  NEUTRAL: 'neutral',         // 中立倾向
  RISK_AVERSE: 'risk_averse', // 风险规避
  RISK_TAKING: 'risk_taking'  // 风险偏好
};

// AI代理基类
class AIAgent {
  constructor(character) {
    this.character = character;
    this.memory = []; // 代理记忆
    this.memoryLimit = 50; // 记忆容量限制
    this.behaviorTendency = this.calculateBehaviorTendency();
    this.lastDecision = null;
    this.decisionCooldown = 0; // 决策冷却时间
    this.targetCharacter = null; // 互动目标角色
    this.currentEvent = null; // 当前正在参与的事件
  }
  
  // 根据角色属性计算行为倾向
  calculateBehaviorTendency() {
    // 勇气高 -> 风险偏好
    // 智慧高 -> 合作倾向
    // 感知高 -> 中立平衡
    
    if (this.character.courage > 70) {
      return BEHAVIOR_TENDENCY.RISK_TAKING;
    } else if (this.character.wisdom > 70) {
      return BEHAVIOR_TENDENCY.COOPERATIVE;
    } else if (this.character.perception > 70) {
      return BEHAVIOR_TENDENCY.NEUTRAL;
    } else if (this.character.courage < 30) {
      return BEHAVIOR_TENDENCY.RISK_AVERSE;
    } else if (this.character.wisdom < 30) {
      return BEHAVIOR_TENDENCY.COMPETITIVE;
    } else {
      // 默认行为倾向基于随机因素和角色类型
      const tendencies = Object.values(BEHAVIOR_TENDENCY);
      const typeInfluence = {
        [CHARACTER_TYPE.TRIANGLE]: [0.3, 0.3, 0.1, 0.1, 0.2], // 三角形更竞争/冒险
        [CHARACTER_TYPE.SQUARE]: [0.2, 0.2, 0.3, 0.2, 0.1],   // 正方形更平衡
        [CHARACTER_TYPE.DIAMOND]: [0.3, 0.1, 0.3, 0.2, 0.1],  // 菱形更合作/分析
        [CHARACTER_TYPE.CIRCLE]: [0.4, 0.1, 0.2, 0.1, 0.2]    // 圆形更合作/社交
      };
      
      // 根据角色类型的影响权重选择行为倾向
      const weights = typeInfluence[this.character.type] || [0.2, 0.2, 0.2, 0.2, 0.2];
      return this.weightedRandomChoice(tendencies, weights);
    }
  }
  
  // 根据权重随机选择
  weightedRandomChoice(choices, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }
    
    return choices[0]; // 默认返回第一个选项
  }
  
  // 决策主函数
  makeDecision(simulation) {
    // 如果在冷却中，减少冷却时间并返回之前的决策
    if (this.decisionCooldown > 0) {
      this.decisionCooldown--;
      return this.lastDecision;
    }
    
    // 感知环境
    const environment = this.perceiveEnvironment(simulation);
    
    // 评估当前状态
    const state = this.evaluateState(environment);
    
    // 分析可能的行为选项
    const options = this.analyzeOptions(state, environment);
    
    // 选择最佳行为
    const decision = this.selectBestOption(options, state);
    
    // 记录决策
    this.rememberDecision(decision, state);
    
    // 设置决策冷却
    this.decisionCooldown = this.calculateCooldown(decision);
    
    // 保存决策
    this.lastDecision = decision;
    
    return decision;
  }
  
  // 感知环境
  perceiveEnvironment(simulation) {
    const environment = {
      nearbyCharacters: [],
      currentTown: null,
      activeEvents: [],
      availableTowns: []
    };
    
    // 获取当前小镇
    environment.currentTown = simulation.townManager.getTownById(this.character.townId);
    
    // 获取同一小镇的其他角色
    environment.nearbyCharacters = simulation.characterManager.characters.filter(
      c => c.id !== this.character.id && c.townId === this.character.townId
    );
    
    // 获取可迁移的小镇
    environment.availableTowns = simulation.townManager.getValidMigrationTargets(
      this.character.townId,
      this.character.perception
    );
    
    // 获取当前激活的事件
    environment.activeEvents = simulation.eventManager.getActiveEvents().filter(
      event => event.participants.includes(this.character.id)
    );
    
    return environment;
  }
  
  // 评估当前状态
  evaluateState(environment) {
    const state = {
      needsInteraction: false,
      needsMigration: false,
      eventParticipation: false,
      idleState: false
    };
    
    // 根据记忆和环境评估需求
    
    // 评估互动需求 - 基于最近互动时间和可用角色
    const lastInteraction = this.findLastMemoryByType('interaction');
    if (
      (!lastInteraction || (Date.now() - lastInteraction.timestamp > 60000)) && 
      environment.nearbyCharacters.length > 0
    ) {
      state.needsInteraction = true;
    }
    
    // 评估迁移需求 - 基于小镇繁荣度、角色属性和可用小镇
    const lastMigration = this.findLastMemoryByType('migration');
    const townProsperity = environment.currentTown ? environment.currentTown.prosperity : 0;
    
    // 高感知角色更倾向于探索新小镇
    const explorationThreshold = 100 - this.character.perception;
    
    if (
      environment.availableTowns.length > 0 &&
      (!lastMigration || (Date.now() - lastMigration.timestamp > 120000)) &&
      (
        townProsperity < 30 || // 如果当前小镇繁荣度低
        this.character.courage > 70 || // 如果角色勇气高
        (Math.random() * 100 < explorationThreshold) // 随机探索因素
      )
    ) {
      state.needsMigration = true;
    }
    
    // 评估事件参与 - 检查是否有活跃事件需要处理
    if (environment.activeEvents.length > 0) {
      state.eventParticipation = true;
    }
    
    // 如果没有其他需求，则为空闲状态
    if (!state.needsInteraction && !state.needsMigration && !state.eventParticipation) {
      state.idleState = true;
    }
    
    return state;
  }
  
  // 分析可能的行为选项
  analyzeOptions(state, environment) {
    const options = [];
    
    // 根据状态添加不同的选项
    
    // 互动选项
    if (state.needsInteraction && environment.nearbyCharacters.length > 0) {
      for (const character of environment.nearbyCharacters) {
        options.push({
          type: DECISION_TYPE.INTERACT,
          targetCharacterId: character.id,
          utility: this.calculateInteractionUtility(character)
        });
      }
    }
    
    // 迁移选项
    if (state.needsMigration && environment.availableTowns.length > 0) {
      for (const townTarget of environment.availableTowns) {
        // 检查勇气值是否足够支付迁移成本
        if (this.character.courage >= townTarget.courageCost) {
          options.push({
            type: DECISION_TYPE.MIGRATE,
            targetTownId: townTarget.town.id,
            steps: townTarget.steps,
            courageCost: townTarget.courageCost,
            utility: this.calculateMigrationUtility(townTarget, environment.currentTown)
          });
        }
      }
    }
    
    // 事件参与选项
    if (state.eventParticipation) {
      for (const event of environment.activeEvents) {
        options.push({
          type: DECISION_TYPE.PARTICIPATE,
          eventId: event.id,
          utility: this.calculateEventParticipationUtility(event)
        });
      }
    }
    
    // 移动选项 - 随机移动
    options.push({
      type: DECISION_TYPE.MOVE,
      targetX: this.character.x + (Math.random() * 100 - 50),
      targetY: this.character.y + (Math.random() * 100 - 50),
      utility: 0.2 + Math.random() * 0.3 // 较低的基础效用
    });
    
    // 空闲选项
    options.push({
      type: DECISION_TYPE.IDLE,
      utility: 0.1 // 最低效用
    });
    
    return options;
  }
  
  // 选择最佳选项
  selectBestOption(options, state) {
    if (options.length === 0) {
      return { type: DECISION_TYPE.IDLE };
    }
    
    // 添加一些随机性
    const randomFactor = 0.2;
    
    // 根据行为倾向调整效用
    for (const option of options) {
      // 根据行为倾向调整效用
      switch (this.behaviorTendency) {
        case BEHAVIOR_TENDENCY.COOPERATIVE:
          if (option.type === DECISION_TYPE.INTERACT || option.type === DECISION_TYPE.PARTICIPATE) {
            option.utility += 0.2;
          }
          break;
        case BEHAVIOR_TENDENCY.COMPETITIVE:
          if (option.type === DECISION_TYPE.MIGRATE) {
            option.utility += 0.2;
          }
          break;
        case BEHAVIOR_TENDENCY.RISK_TAKING:
          if (option.type === DECISION_TYPE.MIGRATE || option.type === DECISION_TYPE.PARTICIPATE) {
            option.utility += 0.3;
          }
          break;
        case BEHAVIOR_TENDENCY.RISK_AVERSE:
          if (option.type === DECISION_TYPE.IDLE || option.type === DECISION_TYPE.MOVE) {
            option.utility += 0.2;
          }
          if (option.type === DECISION_TYPE.MIGRATE) {
            option.utility -= 0.2;
          }
          break;
      }
      
      // 添加随机因素
      option.utility += Math.random() * randomFactor;
    }
    
    // 选择效用最高的选项
    options.sort((a, b) => b.utility - a.utility);
    return options[0];
  }
  
  // 计算互动效用
  calculateInteractionUtility(targetCharacter) {
    let utility = 0.5; // 基础效用
    
    // 同类型角色互动效用较高
    if (this.character.type === targetCharacter.type) {
      utility += 0.2;
    }
    
    // 智慧高的角色更喜欢与智慧高的角色互动
    if (this.character.wisdom > 60 && targetCharacter.wisdom > 60) {
      utility += 0.15;
    }
    
    // 勇气高的角色不太受角色类型影响
    if (this.character.courage > 70) {
      utility += 0.1;
    }
    
    return utility;
  }
  
  // 计算迁移效用
  calculateMigrationUtility(targetTown, currentTown) {
    let utility = 0.4; // 基础效用
    
    // 目标小镇繁荣度高于当前小镇
    if (targetTown.town.prosperity > currentTown.prosperity) {
      utility += 0.3;
    }
    
    // 步骤数较少的迁移更有吸引力
    utility -= targetTown.steps * 0.05;
    
    // 勇气消耗较少的迁移更有吸引力
    utility -= (targetTown.courageCost / this.character.courage) * 0.2;
    
    return utility;
  }
  
  // 计算事件参与效用
  calculateEventParticipationUtility(event) {
    let utility = 0.7; // 基础效用 - 事件通常较重要
    
    // 基于事件类型调整效用
    switch (event.type) {
      case EVENT_TYPE.LOCAL:
        utility += 0.1;
        break;
      case EVENT_TYPE.TOWN:
        utility += 0.2;
        break;
      case EVENT_TYPE.GLOBAL:
        utility += 0.3;
        break;
      case EVENT_TYPE.SEASONAL:
        utility += 0.2;
        break;
    }
    
    // 事件即将过期的紧急性
    if (event.duration > 0) {
      const remainingTime = (event.timestamp + event.duration) - Date.now();
      const urgencyFactor = 1 - (remainingTime / event.duration);
      utility += urgencyFactor * 0.3;
    }
    
    return utility;
  }
  
  // 记录决策到记忆
  rememberDecision(decision, state) {
    const memory = {
      type: decision.type,
      timestamp: Date.now(),
      context: { ...state },
      decision: { ...decision }
    };
    
    this.memory.push(memory);
    
    // 限制记忆大小
    if (this.memory.length > this.memoryLimit) {
      this.memory.shift(); // 移除最旧的记忆
    }
  }
  
  // 从记忆中查找最近的特定类型记忆
  findLastMemoryByType(type) {
    for (let i = this.memory.length - 1; i >= 0; i--) {
      if (this.memory[i].type === type) {
        return this.memory[i];
      }
    }
    return null;
  }
  
  // 计算决策冷却时间
  calculateCooldown(decision) {
    switch (decision.type) {
      case DECISION_TYPE.MOVE:
        return 3; // 移动冷却短
      case DECISION_TYPE.INTERACT:
        return 10; // 互动冷却中等
      case DECISION_TYPE.MIGRATE:
        return 30; // 迁移冷却长
      case DECISION_TYPE.PARTICIPATE:
        return 20; // 参与事件冷却中等
      case DECISION_TYPE.IDLE:
        return 5; // 空闲冷却短
      default:
        return 5;
    }
  }
  
  // 执行决策
  executeDecision(decision, simulation) {
    switch (decision.type) {
      case DECISION_TYPE.MOVE:
        this.executeMove(decision);
        break;
      case DECISION_TYPE.INTERACT:
        this.executeInteraction(decision, simulation);
        break;
      case DECISION_TYPE.MIGRATE:
        this.executeMigration(decision, simulation);
        break;
      case DECISION_TYPE.PARTICIPATE:
        this.executeEventParticipation(decision, simulation);
        break;
      case DECISION_TYPE.IDLE:
        // 空闲状态不执行特定操作
        break;
    }
  }
  
  // 执行移动
  executeMove(decision) {
    this.character.setTarget(decision.targetX, decision.targetY);
  }
  
  // 执行互动
  executeInteraction(decision, simulation) {
    const targetCharacter = simulation.characterManager.characters.find(
      c => c.id === decision.targetCharacterId
    );
    
    if (targetCharacter) {
      this.targetCharacter = targetCharacter;
      
      // 移动到目标角色附近
      const offsetX = (Math.random() * 40) - 20;
      const offsetY = (Math.random() * 40) - 20;
      this.character.setTarget(targetCharacter.x + offsetX, targetCharacter.y + offsetY);
      
      // 随机决定是否创建互动事件
      if (Math.random() < 0.3 && simulation.eventManager) {
        const eventTypes = ['knowledge', 'resource'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        simulation.eventManager.createEvent(eventType, '', {
          participants: [this.character.id, targetCharacter.id]
        });
      }
    }
  }
  
  // 执行迁移
  executeMigration(decision, simulation) {
    if (simulation.townManager) {
      const result = simulation.townManager.migrateCharacter(
        this.character,
        decision.targetTownId
      );
      
      if (result) {
        // 迁移成功，移动到新小镇中心位置
        const newTown = simulation.townManager.getTownById(decision.targetTownId);
        if (newTown) {
          const offsetX = (Math.random() * 60) - 30;
          const offsetY = (Math.random() * 60) - 30;
          this.character.setTarget(newTown.x + offsetX, newTown.y + offsetY);
        }
      }
    }
  }
  
  // 执行事件参与
  executeEventParticipation(decision, simulation) {
    if (!simulation.eventManager) return;
    
    const event = simulation.eventManager.events.find(e => e.id === decision.eventId);
    if (!event || event.resolved) return;
    
    this.currentEvent = event;
    
    // 根据事件类型和角色特性做出决策
    if (event instanceof AIPrisonersDilemmaEvent) {
      let cooperationProbability = 0.5; // 基础合作概率
      
      // 根据角色属性和行为倾向调整合作概率
      if (this.character.wisdom > 70) cooperationProbability += 0.2;
      if (this.character.courage > 70) cooperationProbability -= 0.1;
      
      switch (this.behaviorTendency) {
        case BEHAVIOR_TENDENCY.COOPERATIVE:
          cooperationProbability += 0.3;
          break;
        case BEHAVIOR_TENDENCY.COMPETITIVE:
          cooperationProbability -= 0.3;
          break;
        case BEHAVIOR_TENDENCY.RISK_TAKING:
          cooperationProbability -= 0.2;
          break;
        case BEHAVIOR_TENDENCY.RISK_AVERSE:
          cooperationProbability += 0.1;
          break;
      }
      
      // 根据角色类型的特权调整合作概率
      switch (this.character.type) {
        case CHARACTER_TYPE.TRIANGLE: // 三角形战士更倾向于背叛
          cooperationProbability -= 0.1;
          break;
        case CHARACTER_TYPE.SQUARE: // 四边形牧师更平衡
          // 检查对方上一轮决策，实现"以牙还牙"策略
          if (event.currentRound > 0 && event.participants.length === 2) {
            const otherParticipant = event.participants.find(p => p !== this.character.id);
            const otherDecisions = event.decisions[otherParticipant];
            if (otherDecisions && otherDecisions[event.currentRound - 1] === 'defect') {
              cooperationProbability -= 0.3; // 如果对方上一轮背叛，则减少合作概率
            }
          }
          break;
        case CHARACTER_TYPE.DIAMOND: // 菱形学者更倾向于宽容策略
          cooperationProbability += 0.1;
          break;
        case CHARACTER_TYPE.CIRCLE: // 圆形贵族有灵活策略
          // 随机决定是合作还是背叛，体现灵活性
          cooperationProbability = Math.random();
          break;
      }
      
      // 确保概率在0-1范围内
      cooperationProbability = Math.max(0, Math.min(1, cooperationProbability));
      
      // 根据概率做出决定
      const decision = Math.random() < cooperationProbability ? 'cooperate' : 'defect';
      
      // 记录决策到事件
      event.recordDecision(this.character.id, decision);
    } else if (event instanceof TownInfrastructureEvent) {
      // 贡献参与 - 根据角色类型和特性决定贡献量
      let contributionAmount = 3 + Math.floor(Math.random() * 4); // 基础贡献3-6
      
      // 智慧高的角色贡献更多
      if (this.character.wisdom > 60) contributionAmount += 2;
      
      // 根据行为倾向调整
      switch (this.behaviorTendency) {
        case BEHAVIOR_TENDENCY.COOPERATIVE:
          contributionAmount += 3;
          break;
        case BEHAVIOR_TENDENCY.COMPETITIVE:
          contributionAmount -= 2;
          break;
      }
      
      // 确保贡献量为正
      contributionAmount = Math.max(1, contributionAmount);
      
      // 记录贡献
      event.recordContribution(this.character.id, contributionAmount);
    } else if (event instanceof GlobalEarthquakeEvent) {
      // 决定是否参与救援
      let participationProbability = 0.6; // 基础参与概率
      
      // 勇气高的角色更可能参与救援
      if (this.character.courage > 60) participationProbability += 0.2;
      
      // 根据行为倾向调整
      switch (this.behaviorTendency) {
        case BEHAVIOR_TENDENCY.COOPERATIVE:
          participationProbability += 0.3;
          break;
        case BEHAVIOR_TENDENCY.RISK_AVERSE:
          participationProbability -= 0.3;
          break;
      }
      
      // 确保概率在0-1范围内
      participationProbability = Math.max(0, Math.min(1, participationProbability));
      
      // 根据概率决定是否参与
      const participate = Math.random() < participationProbability;
      
      // 记录参与决定
      event.recordRescueParticipation(this.character.id, participate);
    } else if (event instanceof SeasonalFestivalEvent) {
      // 决定是否参加节日
      event.recordAttendance(this.character.id);
      
      // 决定是否贡献艺术作品
      let contributionProbability = 0.4; // 基础贡献概率
      
      // 感知高的角色更可能贡献艺术作品
      if (this.character.perception > 60) contributionProbability += 0.3;
      
      // 根据行为倾向调整
      switch (this.behaviorTendency) {
        case BEHAVIOR_TENDENCY.COOPERATIVE:
          contributionProbability += 0.2;
          break;
        case BEHAVIOR_TENDENCY.COMPETITIVE:
          contributionProbability -= 0.1;
          break;
      }
      
      // 根据角色类型调整
      if (this.character.type === CHARACTER_TYPE.DIAMOND) { // 菱形学者更有艺术天赋
        contributionProbability += 0.2;
      }
      
      // 确保概率在0-1范围内
      contributionProbability = Math.max(0, Math.min(1, contributionProbability));
      
      // 根据概率决定是否贡献
      if (Math.random() < contributionProbability) {
        // 计算作品质量 (1-10)
        let quality = 3 + Math.floor(Math.random() * 5); // 基础质量3-7
        
        // 感知和智慧影响作品质量
        quality += Math.floor((this.character.perception + this.character.wisdom) / 30);
        
        // 确保质量在1-10范围内
        quality = Math.min(10, Math.max(1, quality));
        
        // 记录艺术贡献
        event.recordArtisticContribution(this.character.id, quality);
      }
    }
  }
  
  // 获取代理详情
  getDetails() {
    return {
      behaviorTendency: this.translateBehaviorTendency(this.behaviorTendency),
      lastDecisionType: this.lastDecision ? this.translateDecisionType(this.lastDecision.type) : "无",
      memoryCount: this.memory.length,
      currentEventId: this.currentEvent ? this.currentEvent.id : null,
      targetCharacterId: this.targetCharacter ? this.targetCharacter.id : null
    };
  }
  
  // 翻译行为倾向为中文
  translateBehaviorTendency(tendency) {
    const translations = {
      [BEHAVIOR_TENDENCY.COOPERATIVE]: "合作型",
      [BEHAVIOR_TENDENCY.COMPETITIVE]: "竞争型",
      [BEHAVIOR_TENDENCY.NEUTRAL]: "中立型",
      [BEHAVIOR_TENDENCY.RISK_AVERSE]: "谨慎型",
      [BEHAVIOR_TENDENCY.RISK_TAKING]: "冒险型"
    };
    
    return translations[tendency] || tendency;
  }
  
  // 翻译决策类型为中文
  translateDecisionType(type) {
    const translations = {
      [DECISION_TYPE.MOVE]: "移动",
      [DECISION_TYPE.INTERACT]: "互动",
      [DECISION_TYPE.MIGRATE]: "迁移",
      [DECISION_TYPE.PARTICIPATE]: "参与事件",
      [DECISION_TYPE.IDLE]: "空闲"
    };
    
    return translations[type] || type;
  }
}

// AI代理管理器
class AIAgentManager {
  constructor() {
    this.agents = new Map(); // 代理映射 {characterId: AIAgent}
  }
  
  // 为角色创建AI代理
  createAgent(character) {
    if (!character || this.agents.has(character.id)) return;
    
    const agent = new AIAgent(character);
    this.agents.set(character.id, agent);
    return agent;
  }
  
  // 批量创建AI代理
  createAgentsBatch(characters) {
    for (const character of characters) {
      this.createAgent(character);
    }
  }
  
  // 获取特定角色的代理
  getAgent(characterId) {
    return this.agents.get(characterId);
  }
  
  // 更新所有代理
  updateAgents(simulation) {
    for (const [characterId, agent] of this.agents.entries()) {
      // 确保角色仍然存在
      const character = simulation.characterManager.characters.find(c => c.id === characterId);
      if (!character) {
        this.agents.delete(characterId);
        continue;
      }
      
      // 更新代理引用的角色（以防属性发生变化）
      agent.character = character;
      
      // 做出决策并执行
      const decision = agent.makeDecision(simulation);
      if (decision) {
        agent.executeDecision(decision, simulation);
      }
    }
  }
  
  // 获取所有代理详情
  getAllAgentDetails() {
    const details = {};
    for (const [characterId, agent] of this.agents.entries()) {
      details[characterId] = agent.getDetails();
    }
    return details;
  }
}

// 导出AI代理管理器实例
const aiAgentManager = new AIAgentManager();
