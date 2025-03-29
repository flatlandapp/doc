/**
 * Flatland事件系统
 * 实现各种类型的事件：局部事件、小镇事件、全局事件和季节性事件
 */

// 事件类型枚举
const EVENT_TYPE = {
  LOCAL: 'local',           // 局部事件，影响特定角色
  TOWN: 'town',             // 小镇事件，影响整个小镇
  GLOBAL: 'global',         // 全局事件，影响多个小镇
  SEASONAL: 'seasonal'      // 季节性事件，定期发生
};

// 事件影响范围枚举
const EVENT_SCOPE = {
  INDIVIDUAL: 'individual', // 个体影响
  GROUP: 'group',           // 群体影响
  TOWN: 'town',             // 小镇影响
  NETWORK: 'network'        // 小镇网络影响
};

// 事件结果类型枚举
const EVENT_OUTCOME = {
  POSITIVE: 'positive',     // 积极结果
  NEGATIVE: 'negative',     // 消极结果
  NEUTRAL: 'neutral',       // 中性结果
  MIXED: 'mixed'            // 混合结果
};

// 基础事件类
class GameEvent {
  constructor(id, type, title) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.description = '';
    this.scope = EVENT_SCOPE.INDIVIDUAL;
    this.timestamp = Date.now();
    this.duration = 0; // 持续时间（毫秒），0表示瞬时事件
    this.participants = []; // 参与者ID列表
    this.townIds = []; // 相关小镇ID列表
    this.outcome = EVENT_OUTCOME.NEUTRAL; // 事件结果
    this.choices = []; // 可能的选择
    this.resolved = false; // 事件是否已解决
    this.resolution = null; // 事件解决方式
  }
  
  // 设置事件描述
  setDescription(description) {
    this.description = description;
    return this;
  }
  
  // 设置事件范围
  setScope(scope) {
    this.scope = scope;
    return this;
  }
  
  // 添加参与者
  addParticipant(characterId) {
    if (!this.participants.includes(characterId)) {
      this.participants.push(characterId);
    }
    return this;
  }
  
  // 添加相关小镇
  addTown(townId) {
    if (!this.townIds.includes(townId)) {
      this.townIds.push(townId);
    }
    return this;
  }
  
  // 设置事件持续时间
  setDuration(milliseconds) {
    this.duration = milliseconds;
    return this;
  }
  
  // 添加选择选项
  addChoice(choice) {
    this.choices.push(choice);
    return this;
  }
  
  // 解决事件
  resolve(choiceIndex, outcome) {
    this.resolved = true;
    this.resolution = {
      choiceIndex,
      outcome,
      timestamp: Date.now()
    };
    return this;
  }
  
  // 检查事件是否过期
  isExpired() {
    if (this.duration === 0) return false; // 瞬时事件不会过期
    return Date.now() > this.timestamp + this.duration;
  }
  
  // 获取事件详情
  getDetails() {
    return {
      id: this.id,
      type: this.translateEventType(this.type),
      title: this.title,
      description: this.description,
      timestamp: new Date(this.timestamp).toLocaleString(),
      resolved: this.resolved,
      participants: this.participants.length,
      towns: this.townIds.length,
      outcome: this.translateOutcome(this.outcome)
    };
  }
  
  // 翻译事件类型为中文
  translateEventType(type) {
    const translations = {
      [EVENT_TYPE.LOCAL]: "局部事件",
      [EVENT_TYPE.TOWN]: "小镇事件",
      [EVENT_TYPE.GLOBAL]: "全局事件",
      [EVENT_TYPE.SEASONAL]: "季节性事件"
    };
    
    return translations[type] || type;
  }
  
  // 翻译结果类型为中文
  translateOutcome(outcome) {
    const translations = {
      [EVENT_OUTCOME.POSITIVE]: "积极",
      [EVENT_OUTCOME.NEGATIVE]: "消极",
      [EVENT_OUTCOME.NEUTRAL]: "中性",
      [EVENT_OUTCOME.MIXED]: "混合"
    };
    
    return translations[outcome] || outcome;
  }
}

// AI策略事件类（囚徒困境类型事件）
class AIPrisonersDilemmaEvent extends GameEvent {
  constructor(id, title, participants) {
    super(id, EVENT_TYPE.LOCAL, title);
    this.participants = participants;
    this.dilemmaType = 'standard'; // 标准、迭代、多人等
    this.rounds = 1; // 回合数
    this.currentRound = 0;
    this.decisions = {}; // 参与者决策 {characterId: ['cooperate', 'defect', ...]}
    this.scores = {}; // 参与者得分 {characterId: score}
    
    // 初始化得分
    for (const characterId of participants) {
      this.scores[characterId] = 0;
      this.decisions[characterId] = [];
    }
  }
  
  // 设置困境类型
  setDilemmaType(type) {
    this.dilemmaType = type;
    return this;
  }
  
  // 设置回合数
  setRounds(rounds) {
    this.rounds = rounds;
    return this;
  }
  
  // 记录决策
  recordDecision(characterId, decision) {
    if (this.participants.includes(characterId) && this.currentRound < this.rounds) {
      if (!this.decisions[characterId]) {
        this.decisions[characterId] = [];
      }
      this.decisions[characterId][this.currentRound] = decision;
      
      // 检查本回合是否所有参与者都已做出决策
      let allDecided = true;
      for (const participant of this.participants) {
        if (!this.decisions[participant][this.currentRound]) {
          allDecided = false;
          break;
        }
      }
      
      // 如果所有人都做出了决策，计算本回合得分
      if (allDecided) {
        this.calculateRoundScores();
        this.currentRound++;
        
        // 检查事件是否结束
        if (this.currentRound >= this.rounds) {
          this.resolved = true;
          this.determineOutcome();
        }
      }
    }
    return this;
  }
  
  // 计算本回合得分
  calculateRoundScores() {
    if (this.participants.length === 2) {
      // 标准两人囚徒困境
      const [p1, p2] = this.participants;
      const d1 = this.decisions[p1][this.currentRound];
      const d2 = this.decisions[p2][this.currentRound];
      
      if (d1 === 'cooperate' && d2 === 'cooperate') {
        // 双方合作
        this.scores[p1] += 3;
        this.scores[p2] += 3;
      } else if (d1 === 'cooperate' && d2 === 'defect') {
        // p1合作，p2背叛
        this.scores[p1] += 0;
        this.scores[p2] += 5;
      } else if (d1 === 'defect' && d2 === 'cooperate') {
        // p1背叛，p2合作
        this.scores[p1] += 5;
        this.scores[p2] += 0;
      } else {
        // 双方背叛
        this.scores[p1] += 1;
        this.scores[p2] += 1;
      }
    } else {
      // 多人囚徒困境
      // 计算合作者和背叛者
      const cooperators = [];
      const defectors = [];
      
      for (const pid of this.participants) {
        if (this.decisions[pid][this.currentRound] === 'cooperate') {
          cooperators.push(pid);
        } else {
          defectors.push(pid);
        }
      }
      
      // 合作者得分取决于总合作者数量
      const coopBonus = cooperators.length * 2;
      
      for (const pid of cooperators) {
        this.scores[pid] += coopBonus;
      }
      
      // 背叛者得分取决于合作者数量
      for (const pid of defectors) {
        this.scores[pid] += cooperators.length * 3;
      }
    }
  }
  
  // 确定事件最终结果
  determineOutcome() {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // 计算总得分和最大可能得分（如果全部合作）
    for (const pid of this.participants) {
      totalScore += this.scores[pid];
    }
    
    if (this.participants.length === 2) {
      maxPossibleScore = this.participants.length * this.rounds * 3; // 双方合作每人每轮3分
    } else {
      maxPossibleScore = this.participants.length * this.rounds * (this.participants.length * 2); // 多人全合作
    }
    
    // 根据得分比例确定结果
    const scoreRatio = totalScore / maxPossibleScore;
    
    if (scoreRatio > 0.8) {
      this.outcome = EVENT_OUTCOME.POSITIVE;
    } else if (scoreRatio > 0.5) {
      this.outcome = EVENT_OUTCOME.MIXED;
    } else if (scoreRatio > 0.3) {
      this.outcome = EVENT_OUTCOME.NEUTRAL;
    } else {
      this.outcome = EVENT_OUTCOME.NEGATIVE;
    }
  }
  
  // 获取参与者得分
  getParticipantScore(characterId) {
    return this.scores[characterId] || 0;
  }
  
  // 获取事件详情
  getDetails() {
    const baseDetails = super.getDetails();
    
    return {
      ...baseDetails,
      dilemmaType: this.dilemmaType,
      rounds: this.rounds,
      currentRound: this.currentRound,
      scores: this.scores
    };
  }
}

// 知识宝库事件（局部事件示例）
class KnowledgeRepositoryEvent extends AIPrisonersDilemmaEvent {
  constructor(id, participants) {
    super(id, "知识宝库发现", participants);
    this.setDescription(
      "两位居民发现了一个古老的知识宝库。他们可以选择合作共同学习，或试图独占知识资源。"
    );
    this.setScope(EVENT_SCOPE.INDIVIDUAL);
    this.setRounds(1);
    
    // 添加选择
    this.addChoice({
      text: "合作：双方共同学习，各获得3点智慧值",
      value: "cooperate"
    });
    this.addChoice({
      text: "背叛：尝试独占知识，若成功获得5点智慧值，对方获得0点",
      value: "defect"
    });
  }
  
  // 应用事件结果
  applyResults(characterManager) {
    if (!this.resolved) return;
    
    const [char1Id, char2Id] = this.participants;
    const char1 = characterManager.characters.find(c => c.id === char1Id);
    const char2 = characterManager.characters.find(c => c.id === char2Id);
    
    if (!char1 || !char2) return;
    
    const dec1 = this.decisions[char1Id][0];
    const dec2 = this.decisions[char2Id][0];
    
    if (dec1 === 'cooperate' && dec2 === 'cooperate') {
      // 双方合作
      char1.wisdom += 3;
      char2.wisdom += 3;
    } else if (dec1 === 'cooperate' && dec2 === 'defect') {
      // char1合作，char2背叛
      char2.wisdom += 5;
    } else if (dec1 === 'defect' && dec2 === 'cooperate') {
      // char1背叛，char2合作
      char1.wisdom += 5;
    } else {
      // 双方背叛
      char1.wisdom += 1;
      char2.wisdom += 1;
    }
    
    // 确保属性不超过上限
    if (char1.wisdom > 99) char1.wisdom = 99;
    if (char2.wisdom > 99) char2.wisdom = 99;
    
    // 更新角色边数和类型
    char1.updateEdges();
    char1.updateType();
    char2.updateEdges();
    char2.updateType();
  }
}

// 资源分配事件（局部事件示例）
class ResourceAllocationEvent extends AIPrisonersDilemmaEvent {
  constructor(id, participants) {
    super(id, "资源分配挑战", participants);
    this.setDescription(
      "两位居民发现了稀有的几何染料，可用于改变自身颜色。他们需要决定如何分配这一资源。"
    );
    this.setScope(EVENT_SCOPE.INDIVIDUAL);
    this.setRounds(1);
    
    // 添加选择
    this.addChoice({
      text: "合作：公平分配，各获得3点声望",
      value: "cooperate"
    });
    this.addChoice({
      text: "背叛：尝试独占染料，若成功获得5点声望，对方获得0点",
      value: "defect"
    });
  }
  
  // 应用事件结果
  applyResults(characterManager) {
    if (!this.resolved) return;
    
    const [char1Id, char2Id] = this.participants;
    const char1 = characterManager.characters.find(c => c.id === char1Id);
    const char2 = characterManager.characters.find(c => c.id === char2Id);
    
    if (!char1 || !char2) return;
    
    const dec1 = this.decisions[char1Id][0];
    const dec2 = this.decisions[char2Id][0];
    
    // 在这个简化版本中，我们只是改变角色的颜色
    if (dec1 === 'cooperate' && dec2 === 'cooperate') {
      // 双方合作 - 两人都获得稍微变亮的颜色
      char1.color = lightenColor(char1.color, 0.2);
      char2.color = lightenColor(char2.color, 0.2);
    } else if (dec1 === 'cooperate' && dec2 === 'defect') {
      // char1合作，char2背叛 - char2获得更鲜艳的颜色
      char2.color = saturateColor(char2.color, 0.4);
    } else if (dec1 === 'defect' && dec2 === 'cooperate') {
      // char1背叛，char2合作 - char1获得更鲜艳的颜色
      char1.color = saturateColor(char1.color, 0.4);
    } else {
      // 双方背叛 - 两人获得暗淡的颜色
      char1.color = darkenColor(char1.color, 0.1);
      char2.color = darkenColor(char2.color, 0.1);
    }
  }
}

// 小镇基础设施建设事件（小镇事件示例）
class TownInfrastructureEvent extends GameEvent {
  constructor(id, townId, participants) {
    super(id, EVENT_TYPE.TOWN, "小镇基础设施建设");
    this.addTown(townId);
    for (const participantId of participants) {
      this.addParticipant(participantId);
    }
    
    this.setDescription(
      "小镇需要建设新的公共设施，需要居民共同投入资源和劳力。每个居民需要决定是否真诚参与建设。"
    );
    this.setScope(EVENT_SCOPE.TOWN);
    this.setDuration(24 * 60 * 60 * 1000); // 24小时
    
    this.contributions = {}; // 参与者贡献 {characterId: amount}
    this.targetContribution = participants.length * 5; // 目标贡献总量
    this.currentContribution = 0; // 当前贡献总量
  }
  
  // 记录贡献
  recordContribution(characterId, amount) {
    if (this.participants.includes(characterId) && !this.resolved) {
      this.contributions[characterId] = amount;
      this.currentContribution += amount;
      
      // 检查是否达到目标
      if (this.currentContribution >= this.targetContribution) {
        this.resolve(0, EVENT_OUTCOME.POSITIVE);
      }
      
      // 检查是否所有参与者都已贡献
      let allContributed = true;
      for (const participant of this.participants) {
        if (this.contributions[participant] === undefined) {
          allContributed = false;
          break;
        }
      }
      
      // 如果所有人都做出了贡献但未达到目标
      if (allContributed && !this.resolved) {
        if (this.currentContribution >= this.targetContribution * 0.7) {
          this.resolve(0, EVENT_OUTCOME.MIXED);
        } else {
          this.resolve(0, EVENT_OUTCOME.NEGATIVE);
        }
      }
    }
    return this;
  }
  
  // 应用事件结果
  applyResults(characterManager, townManager) {
    if (!this.resolved) return;
    
    const town = townManager.getTownById(this.townIds[0]);
    if (!town) return;
    
    // 根据事件结果调整小镇繁荣度
    if (this.resolution.outcome === EVENT_OUTCOME.POSITIVE) {
      // 成功建设，增加繁荣度
      town.prosperity += 10;
    } else if (this.resolution.outcome === EVENT_OUTCOME.MIXED) {
      // 部分成功，小幅增加繁荣度
      town.prosperity += 5;
    } else {
      // 失败，小幅减少繁荣度
      town.prosperity = Math.max(0, town.prosperity - 3);
    }
    
    // 奖励积极参与的角色
    for (const participantId of this.participants) {
      const character = characterManager.characters.find(c => c.id === participantId);
      if (!character) continue;
      
      const contribution = this.contributions[participantId] || 0;
      const fairShare = this.targetContribution / this.participants.length;
      
      if (contribution >= fairShare) {
        // 贡献超过平均水平
        character.wisdom += 2;
      } else if (contribution > 0) {
        // 有所贡献但不足
        character.wisdom += 1;
      }
      
      // 确保属性不超过上限
      if (character.wisdom > 99) character.wisdom = 99;
      
      // 更新角色边数和类型
      character.updateEdges();
      character.updateType();
    }
  }
  
  // 获取事件详情
  getDetails() {
    const baseDetails = super.getDetails();
    
    return {
      ...baseDetails,
      currentContribution: this.currentContribution,
      targetContribution: this.targetContribution,
      progress: `${Math.floor((this.currentContribution / this.targetContribution) * 100)}%`
    };
  }
}

// 全局地震救援事件（全局事件示例）
class GlobalEarthquakeEvent extends GameEvent {
  constructor(id, townIds, participants) {
    super(id, EVENT_TYPE.GLOBAL, "跨镇地震救援");
    
    for (const townId of townIds) {
      this.addTown(townId);
    }
    
    for (const participantId of participants) {
      this.addParticipant(participantId);
    }
    
    this.setDescription(
      "多个小镇发生地震，所有居民需要决定是否参与救援行动。"
    );
    this.setScope(EVENT_SCOPE.NETWORK);
    this.setDuration(48 * 60 * 60 * 1000); // 48小时
    
    this.rescuers = []; // 参与救援的角色ID
    this.targetRescuerCount = Math.ceil(participants.length * 0.6); // 目标救援者数量，至少60%参与
  }
  
  // 记录救援参与
  recordRescueParticipation(characterId, participating) {
    if (this.participants.includes(characterId) && !this.resolved) {
      if (participating && !this.rescuers.includes(characterId)) {
        this.rescuers.push(characterId);
      }
      
      // 检查是否达到目标
      if (this.rescuers.length >= this.targetRescuerCount) {
        this.resolve(0, EVENT_OUTCOME.POSITIVE);
      }
      
      // 检查是否所有参与者都已决定
      if (this.rescuers.length + (this.participants.length - this.rescuers.length) === this.participants.length) {
        if (!this.resolved) {
          const participationRate = this.rescuers.length / this.participants.length;
          
          if (participationRate >= 0.4) {
            this.resolve(0, EVENT_OUTCOME.MIXED);
          } else {
            this.resolve(0, EVENT_OUTCOME.NEGATIVE);
          }
        }
      }
    }
    return this;
  }
  
  // 应用事件结果
  applyResults(characterManager, townManager) {
    if (!this.resolved) return;
    
    // 更新小镇繁荣度
    for (const townId of this.townIds) {
      const town = townManager.getTownById(townId);
      if (!town) continue;
      
      if (this.resolution.outcome === EVENT_OUTCOME.POSITIVE) {
        // 成功救援，增加繁荣度
        town.prosperity += 8;
      } else if (this.resolution.outcome === EVENT_OUTCOME.MIXED) {
        // 部分成功救援，小幅增加繁荣度
        town.prosperity += 3;
      } else {
        // 救援失败，减少繁荣度
        town.prosperity = Math.max(0, town.prosperity - 5);
      }
    }
    
    // 更新角色属性
    for (const participantId of this.participants) {
      const character = characterManager.characters.find(c => c.id === participantId);
      if (!character) continue;
      
      if (this.rescuers.includes(participantId)) {
        // 参与救援的角色
        if (this.resolution.outcome === EVENT_OUTCOME.POSITIVE) {
          // 成功救援，增加勇气和智慧
          character.courage += 2;
          character.wisdom += 1;
        } else if (this.resolution.outcome === EVENT_OUTCOME.MIXED) {
          // 部分成功，增加勇气
          character.courage += 1;
        }
      } else {
        // 未参与救援的角色
        if (this.resolution.outcome === EVENT_OUTCOME.NEGATIVE) {
          // 灾难扩大，所有人受损
          character.courage = Math.max(1, character.courage - 1);
        }
      }
      
      // 确保属性不超过上限
      if (character.courage > 99) character.courage = 99;
      if (character.wisdom > 99) character.wisdom = 99;
      
      // 更新角色边数和类型
      character.updateEdges();
      character.updateType();
    }
  }
  
  // 获取事件详情
  getDetails() {
    const baseDetails = super.getDetails();
    
    return {
      ...baseDetails,
      rescuerCount: this.rescuers.length,
      targetRescuerCount: this.targetRescuerCount,
      participationRate: `${Math.floor((this.rescuers.length / this.participants.length) * 100)}%`
    };
  }
}

// 季节性节日庆典事件（季节性事件示例）
class SeasonalFestivalEvent extends GameEvent {
  constructor(id, townIds, participants) {
    super(id, EVENT_TYPE.SEASONAL, "几何艺术节");
    
    for (const townId of townIds) {
      this.addTown(townId);
    }
    
    for (const participantId of participants) {
      this.addParticipant(participantId);
    }
    
    this.setDescription(
      "一年一度的几何艺术节开始了，居民们可以展示自己的几何艺术作品并参与庆典活动。"
    );
    this.setScope(EVENT_SCOPE.NETWORK);
    this.setDuration(7 * 24 * 60 * 60 * 1000); // 7天
    
    this.artisticContributions = {}; // 艺术贡献 {characterId: quality}
    this.attendees = []; // 庆典参与者
  }
  
  // 记录艺术贡献
  recordArtisticContribution(characterId, quality) {
    if (this.participants.includes(characterId) && !this.resolved) {
      this.artisticContributions[characterId] = quality;
      if (!this.attendees.includes(characterId)) {
        this.attendees.push(characterId);
      }
    }
    return this;
  }
  
  // 记录庆典参与
  recordAttendance(characterId) {
    if (this.participants.includes(characterId) && !this.resolved && !this.attendees.includes(characterId)) {
      this.attendees.push(characterId);
    }
    return this;
  }
  
  // 解决事件
  finalizeEvent() {
    if (!this.resolved) {
      const attendanceRate = this.attendees.length / this.participants.length;
      const contributionCount = Object.keys(this.artisticContributions).length;
      const contributionRate = contributionCount / this.participants.length;
      
      // 计算艺术作品平均质量
      let totalQuality = 0;
      for (const quality of Object.values(this.artisticContributions)) {
        totalQuality += quality;
      }
      const averageQuality = contributionCount > 0 ? totalQuality / contributionCount : 0;
      
      // 确定事件结果
      if (attendanceRate > 0.7 && contributionRate > 0.3 && averageQuality > 7) {
        this.resolve(0, EVENT_OUTCOME.POSITIVE);
      } else if (attendanceRate > 0.5 && contributionRate > 0.2 && averageQuality > 5) {
        this.resolve(0, EVENT_OUTCOME.MIXED);
      } else if (attendanceRate > 0.3) {
        this.resolve(0, EVENT_OUTCOME.NEUTRAL);
      } else {
        this.resolve(0, EVENT_OUTCOME.NEGATIVE);
      }
    }
    return this;
  }
  
  // 应用事件结果
  applyResults(characterManager, townManager) {
    if (!this.resolved) {
      this.finalizeEvent();
    }
    
    // 更新小镇繁荣度
    for (const townId of this.townIds) {
      const town = townManager.getTownById(townId);
      if (!town) continue;
      
      if (this.resolution.outcome === EVENT_OUTCOME.POSITIVE) {
        // 成功的庆典，显著增加繁荣度
        town.prosperity += 15;
      } else if (this.resolution.outcome === EVENT_OUTCOME.MIXED) {
        // 一般成功的庆典，中等增加繁荣度
        town.prosperity += 8;
      } else if (this.resolution.outcome === EVENT_OUTCOME.NEUTRAL) {
        // 平淡的庆典，小幅增加繁荣度
        town.prosperity += 3;
      } else {
        // 失败的庆典，不影响繁荣度
      }
    }
    
    // 更新角色属性
    for (const participantId of this.participants) {
      const character = characterManager.characters.find(c => c.id === participantId);
      if (!character) continue;
      
      // 艺术贡献者获得额外感知提升
      if (this.artisticContributions[participantId]) {
        const quality = this.artisticContributions[participantId];
        // 高质量贡献获得感知提升
        if (quality > 7) {
          character.perception += 3;
        } else if (quality > 5) {
          character.perception += 2;
        } else {
          character.perception += 1;
        }
      } else if (this.attendees.includes(participantId)) {
        // 仅参与但未贡献作品的居民获得小幅感知提升
        character.perception += 1;
      }
      
      // 确保属性不超过上限
      if (character.perception > 99) character.perception = 99;
      
      // 更新角色边数和类型
      character.updateEdges();
      character.updateType();
    }
  }
  
  // 获取事件详情
  getDetails() {
    const baseDetails = super.getDetails();
    
    return {
      ...baseDetails,
      attendeeCount: this.attendees.length,
      participationRate: `${Math.floor((this.attendees.length / this.participants.length) * 100)}%`,
      contributionCount: Object.keys(this.artisticContributions).length,
    };
  }
}

// 颜色处理辅助函数
// 使颜色变亮
function lightenColor(hexColor, amount) {
  return adjustColor(hexColor, amount, (c, a) => Math.min(255, c + Math.floor(a * 255)));
}

// 使颜色变暗
function darkenColor(hexColor, amount) {
  return adjustColor(hexColor, amount, (c, a) => Math.max(0, c - Math.floor(a * 255)));
}

// 增强颜色饱和度
function saturateColor(hexColor, amount) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  
  // 转换为HSL
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // 增加饱和度
  hsl.s = Math.min(1, hsl.s + amount);
  
  // 转回RGB
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  
  // 转回Hex
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// 调整颜色
function adjustColor(hexColor, amount, adjustFunc) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;
  
  const newRgb = {
    r: adjustFunc(rgb.r, amount),
    g: adjustFunc(rgb.g, amount),
    b: adjustFunc(rgb.b, amount)
  };
  
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// 十六进制转RGB
function hexToRgb(hex) {
  // 移除#符号（如果有）
  hex = hex.replace('#', '');
  
  // 处理简写形式（#ABC -> #AABBCC）
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

// RGB转十六进制
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// RGB转HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // 灰色
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return { h, s, l };
}

// HSL转RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // 灰色
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// 事件管理器
class EventManager {
  constructor() {
    this.events = [];
    this.eventCounter = 0;
  }
  
  // 创建新事件
  createEvent(type, title, params = {}) {
    const id = `event_${this.eventCounter++}`;
    let event;
    
    switch (type) {
      case 'knowledge':
        event = new KnowledgeRepositoryEvent(id, params.participants || []);
        break;
      case 'resource':
        event = new ResourceAllocationEvent(id, params.participants || []);
        break;
      case 'infrastructure':
        event = new TownInfrastructureEvent(id, params.townId, params.participants || []);
        break;
      case 'earthquake':
        event = new GlobalEarthquakeEvent(id, params.townIds || [], params.participants || []);
        break;
      case 'festival':
        event = new SeasonalFestivalEvent(id, params.townIds || [], params.participants || []);
        break;
      default:
        // 创建基础事件
        event = new GameEvent(id, EVENT_TYPE.LOCAL, title);
        break;
    }
    
    this.events.push(event);
    return event;
  }
  
  // 获取所有激活事件
  getActiveEvents() {
    return this.events.filter(event => !event.resolved && !event.isExpired());
  }
  
  // 获取所有已解决事件
  getResolvedEvents() {
    return this.events.filter(event => event.resolved);
  }
  
  // 获取特定类型的事件
  getEventsByType(type) {
    return this.events.filter(event => event.type === type);
  }
  
  // 获取特定角色参与的事件
  getEventsByParticipant(characterId) {
    return this.events.filter(event => event.participants.includes(characterId));
  }
  
  // 获取特定小镇的事件
  getEventsByTown(townId) {
    return this.events.filter(event => event.townIds.includes(townId));
  }
  
  // 应用事件结果
  applyEventResults(characterManager, townManager) {
    for (const event of this.events) {
      if (event.resolved && typeof event.applyResults === 'function') {
        event.applyResults(characterManager, townManager);
      }
    }
  }
  
  // 更新所有事件
  updateEvents() {
    // 检查是否有过期事件需要自动解决
    for (const event of this.events) {
      if (!event.resolved && event.isExpired()) {
        // 自动解决已过期事件
        if (typeof event.finalizeEvent === 'function') {
          event.finalizeEvent();
        } else {
          event.resolve(0, EVENT_OUTCOME.NEUTRAL);
        }
      }
    }
  }
  
  // 随机生成事件
  generateRandomEvent(characterManager, townManager) {
    const allCharacters = characterManager.getAllCharacters();
    const allTowns = townManager.getAllTowns();
    
    if (allCharacters.length < 2 || allTowns.length === 0) return null;
    
    // 随机决定事件类型
    const eventTypes = ['knowledge', 'resource', 'infrastructure', 'earthquake', 'festival'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    let event;
    
    switch (eventType) {
      case 'knowledge':
      case 'resource':
        // 选择两个随机角色
        const randomChars = selectRandomElements(allCharacters, 2);
        event = this.createEvent(eventType, '', {
          participants: randomChars.map(c => c.id)
        });
        break;
      case 'infrastructure':
        // 选择一个随机小镇和其中的居民
        const randomTown = selectRandomElements(allTowns, 1)[0];
        const townResidents = characterManager.getCharactersByTown(randomTown.id);
        
        if (townResidents.length >= 3) {
          event = this.createEvent(eventType, '', {
            townId: randomTown.id,
            participants: townResidents.map(c => c.id)
          });
        }
        break;
      case 'earthquake':
        // 选择多个小镇和所有居民
        const affectedTowns = selectRandomElements(allTowns, Math.min(3, allTowns.length));
        const affectedResidents = [];
        
        for (const town of affectedTowns) {
          const residents = characterManager.getCharactersByTown(town.id);
          for (const resident of residents) {
            affectedResidents.push(resident.id);
          }
        }
        
        if (affectedResidents.length > 0) {
          event = this.createEvent(eventType, '', {
            townIds: affectedTowns.map(t => t.id),
            participants: affectedResidents
          });
        }
        break;
      case 'festival':
        // 所有小镇和所有居民参与的节日
        event = this.createEvent(eventType, '', {
          townIds: allTowns.map(t => t.id),
          participants: allCharacters.map(c => c.id)
        });
        break;
    }
    
    return event;
  }
}

// 辅助函数：从数组中随机选择n个元素
function selectRandomElements(array, n) {
  if (n >= array.length) return [...array];
  
  const result = [];
  const indices = new Set();
  
  while (result.length < n) {
    const index = Math.floor(Math.random() * array.length);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(array[index]);
    }
  }
  
  return result;
}

// 导出事件管理器实例
const eventManager = new EventManager();
