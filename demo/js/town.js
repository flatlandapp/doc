/**
 * Flatland小镇系统
 * 实现小镇的繁荣度、出生率、地形等功能
 */

// 小镇类型枚举
const TOWN_TYPE = {
  AGRICULTURAL: 'agricultural', // 农业
  INDUSTRIAL: 'industrial',     // 工业
  COMMERCIAL: 'commercial',     // 商业
  CULTURAL: 'cultural'          // 文化
};

// 小镇状态枚举
const TOWN_STATUS = {
  ACTIVE: 'active',       // 活跃
  INACTIVE: 'inactive'    // 非活跃
};

// 地形类型枚举
const TERRAIN_TYPE = {
  PLAINS: 'plains',       // 平原
  HILLS: 'hills',         // 丘陵
  MOUNTAINS: 'mountains', // 山地
  WATER: 'water'          // 水域
};

// 生成随机小镇名称
function generateTownName() {
  const prefixes = ["平", "方", "角", "圆", "边", "线", "点", "几", "形", "度"];
  const suffixes = ["镇", "城", "村", "地", "坡", "区", "州", "域"];
  
  // 直接使用前后缀组合生成名称
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return prefix + suffix;
}

// 生成小镇描述
function generateTownDescription(townType) {
  const descriptions = {
    [TOWN_TYPE.AGRICULTURAL]: [
      "这是一个以农业为主的小镇，平坦的土地上种植着几何形状的庄稼。",
      "田野排列整齐，居民们辛勤劳作，种植着各种形状的作物。",
      "广阔的平原上，三角形和四边形的农民们过着简单而充实的生活。"
    ],
    [TOWN_TYPE.INDUSTRIAL]: [
      "烟囱林立，这座工业小镇充满了机械的轰鸣和几何的秩序。",
      "多边形工匠们在这里创造着精密的几何构造，支撑着整个平面世界的发展。",
      "这座小镇是平面世界工业的心脏，无数形状在这里被塑造和完善。"
    ],
    [TOWN_TYPE.COMMERCIAL]: [
      "市场上人群熙攘，各种形状的商人在此交换商品和知识。",
      "这是一个繁华的商业中心，来自各地的形状在此聚集，交流与贸易蓬勃发展。",
      "街道整齐划一，商店鳞次栉比，是平面世界重要的商业枢纽。"
    ],
    [TOWN_TYPE.CULTURAL]: [
      "这座小镇以其深厚的文化底蕴闻名，吸引着众多追求知识的形状前来学习。",
      "学者和艺术家聚集的地方，圆形哲学家在广场上讨论着世界的本质。",
      "艺术和科学在这里交融，创造出平面世界最精妙的几何艺术。"
    ]
  };
  
  const options = descriptions[townType];
  return options[Math.floor(Math.random() * options.length)];
}

// 小镇基类
class Town {
  constructor(id) {
    this.id = id;
    this.name = generateTownName();
    
    // 基本属性
    this.status = TOWN_STATUS.ACTIVE;
    this.population = 0; // 当前人口
    this.basePopulationCapacity = 100; // 基础人口容量
    this.totalBirths = 0; // 已出生总数
    
    // 随机选择小镇类型
    const townTypes = Object.values(TOWN_TYPE);
    this.type = townTypes[Math.floor(Math.random() * townTypes.length)];
    
    // 地形特性
    this.terrain = this.generateTerrain();
    
    // 生成描述
    this.description = generateTownDescription(this.type);
    
    // 小镇坐标 (在画布中)
    this.x = 0;
    this.y = 0;
    this.size = 120; // 小镇大小
    
    // 繁荣度 - 由居民智慧值总和决定
    this.prosperity = 0;
    
    // 关联小镇 - 可以迁移的目标小镇
    this.connectedTowns = [];
    
    // 建筑和设施位置
    this.buildings = [];
    
    // 初始化建筑位置
    this.initializeBuildings();
  }
  
  // 生成地形特性
  generateTerrain() {
    const terrainTypes = Object.values(TERRAIN_TYPE);
    const primaryTerrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
    
    // 地形影响小镇特性
    const terrainFeatures = {
      [TERRAIN_TYPE.PLAINS]: {
        movementBonus: 0.2, // 平原移动速度加成
        resourceBonus: "food" // 资源加成类型
      },
      [TERRAIN_TYPE.HILLS]: {
        defensiveBonus: 0.15, // 防御加成
        resourceBonus: "materials" // 资源加成类型
      },
      [TERRAIN_TYPE.MOUNTAINS]: {
        wisdomBonus: 0.1, // 智慧加成
        resourceBonus: "minerals" // 资源加成类型
      },
      [TERRAIN_TYPE.WATER]: {
        prosperityBonus: 0.15, // 繁荣度加成
        resourceBonus: "trade" // 资源加成类型
      }
    };
    
    return {
      type: primaryTerrain,
      features: terrainFeatures[primaryTerrain],
      color: this.getTerrainColor(primaryTerrain)
    };
  }
  
  // 获取地形颜色
  getTerrainColor(terrainType) {
    const terrainColors = {
      [TERRAIN_TYPE.PLAINS]: '#c1d699', // 平原 - 浅绿色
      [TERRAIN_TYPE.HILLS]: '#b8b58c',  // 丘陵 - 黄褐色
      [TERRAIN_TYPE.MOUNTAINS]: '#9c9583', // 山地 - 灰褐色
      [TERRAIN_TYPE.WATER]: '#a4c8e0'   // 水域 - 浅蓝色
    };
    
    return terrainColors[terrainType];
  }
  
  // 初始化建筑位置
  initializeBuildings() {
    const buildingCount = 5 + Math.floor(Math.random() * 5); // 5-10个建筑
    
    for (let i = 0; i < buildingCount; i++) {
      // 在小镇范围内随机生成建筑位置
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (this.size * 0.4);
      
      const building = {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 10 + Math.random() * 15,
        type: Math.floor(Math.random() * 4) // 建筑类型 0-3
      };
      
      this.buildings.push(building);
    }
  }
  
  // 添加居民
  addResident(wisdomValue) {
    this.population++;
    this.updateProsperity(wisdomValue); // 增加繁荣度
  }
  
  // 移除居民
  removeResident(wisdomValue) {
    if (this.population > 0) {
      this.population--;
      this.updateProsperity(-wisdomValue); // 减少繁荣度
    }
  }
  
  // 更新繁荣度
  updateProsperity(wisdomChange) {
    // 每10点智慧值增加1点繁荣度
    const prosperityChange = wisdomChange / 10;
    this.prosperity += prosperityChange;
    
    // 繁荣度不能为负
    if (this.prosperity < 0) this.prosperity = 0;
  }
  
  // 计算当前出生率
  calculateBirthRate() {
    // 基础出生率 + 繁荣度加成
    const prosperityBonus = Math.floor(this.prosperity * 0.1); // 每10点繁荣度增加10%出生率
    const rate = Math.min(
      this.basePopulationCapacity * (1 + prosperityBonus / 100),
      this.basePopulationCapacity * 10 // 最高为基础的10倍
    );
    
    return Math.floor(rate);
  }
  
  // 获取可用出生名额
  getAvailableBirths() {
    const currentBirthRate = this.calculateBirthRate();
    return Math.max(0, currentBirthRate - this.totalBirths);
  }
  
  // 记录新出生
  recordBirth() {
    this.totalBirths++;
  }
  
  // 连接到另一个小镇
  connectTo(town) {
    if (!this.connectedTowns.includes(town)) {
      this.connectedTowns.push(town);
      // 双向连接
      if (!town.connectedTowns.includes(this)) {
        town.connectedTowns.push(this);
      }
    }
  }
  
  // 计算与另一个小镇的距离
  distanceTo(town) {
    const dx = this.x - town.x;
    const dy = this.y - town.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // 绘制小镇
  display(p) {
    p.push();
    
    // 移动到小镇位置
    p.translate(this.x, this.y);
    
    // 绘制地形背景
    p.fill(this.terrain.color);
    p.ellipse(0, 0, this.size, this.size);
    
    // 绘制小镇轮廓
    p.noFill();
    p.stroke('#83c5be');
    p.strokeWeight(2);
    p.ellipse(0, 0, this.size + 5, this.size + 5);
    
    // 绘制建筑
    for (const building of this.buildings) {
      p.push();
      p.translate(building.x, building.y);
      
      if (building.type === 0) {
        // 圆形建筑
        p.fill('#264653');
        p.ellipse(0, 0, building.size, building.size);
      } else if (building.type === 1) {
        // 方形建筑
        p.fill('#2a9d8f');
        p.rectMode(p.CENTER);
        p.rect(0, 0, building.size, building.size);
      } else if (building.type === 2) {
        // 三角形建筑
        p.fill('#e76f51');
        p.triangle(
          0, -building.size/2,
          building.size/2, building.size/2,
          -building.size/2, building.size/2
        );
      } else {
        // 菱形建筑
        p.fill('#e9c46a');
        p.beginShape();
        p.vertex(0, -building.size/2);
        p.vertex(building.size/2, 0);
        p.vertex(0, building.size/2);
        p.vertex(-building.size/2, 0);
        p.endShape(p.CLOSE);
      }
      
      p.pop();
    }
    
    // 绘制小镇名称
    p.fill('#006d77');
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.name, 0, this.size/2 + 20);
    
    p.pop();
  }
  
  // 绘制小镇连接线
  displayConnections(p) {
    for (const town of this.connectedTowns) {
      p.stroke('#83c5be');
      p.strokeWeight(1);
      p.line(this.x, this.y, town.x, town.y);
      
      // 绘制中点方向指示
      const midX = (this.x + town.x) / 2;
      const midY = (this.y + town.y) / 2;
      const angle = Math.atan2(town.y - this.y, town.x - this.x);
      
      p.push();
      p.translate(midX, midY);
      p.rotate(angle);
      p.fill('#83c5be');
      p.triangle(0, 0, -8, -4, -8, 4);
      p.pop();
    }
  }
  
  // 获取小镇详细信息
  getDetails() {
    return {
      id: this.id,
      name: this.name,
      type: this.translateTownType(this.type),
      terrain: this.translateTerrainType(this.terrain.type),
      population: this.population,
      prosperity: Math.floor(this.prosperity),
      birthRate: this.calculateBirthRate(),
      availableBirths: this.getAvailableBirths(),
      description: this.description
    };
  }
  
  // 翻译小镇类型为中文
  translateTownType(type) {
    const translations = {
      [TOWN_TYPE.AGRICULTURAL]: "农业小镇",
      [TOWN_TYPE.INDUSTRIAL]: "工业小镇",
      [TOWN_TYPE.COMMERCIAL]: "商业小镇",
      [TOWN_TYPE.CULTURAL]: "文化小镇"
    };
    
    return translations[type] || type;
  }
  
  // 翻译地形类型为中文
  translateTerrainType(type) {
    const translations = {
      [TERRAIN_TYPE.PLAINS]: "平原",
      [TERRAIN_TYPE.HILLS]: "丘陵",
      [TERRAIN_TYPE.MOUNTAINS]: "山地",
      [TERRAIN_TYPE.WATER]: "水域"
    };
    
    return translations[type] || type;
  }
}

// 小镇管理器
class TownManager {
  constructor() {
    this.towns = [];
  }
  
  // 创建新小镇
  createTown() {
    const id = `town_${this.towns.length}`;
    const town = new Town(id);
    this.towns.push(town);
    return town;
  }
  
  // 批量创建小镇并自动连接
  createTowns(count) {
    const canvasWidth = 800;
    const canvasHeight = 500;
    const padding = 100;
    
    for (let i = 0; i < count; i++) {
      const town = this.createTown();
      
      // 分配随机位置
      town.x = padding + Math.random() * (canvasWidth - 2 * padding);
      town.y = padding + Math.random() * (canvasHeight - 2 * padding);
    }
    
    // 自动连接临近小镇
    this.createTownConnections();
    
    return this.towns;
  }
  
  // 创建小镇之间的连接
  createTownConnections() {
    // 确保每个小镇至少有一个连接
    for (const town of this.towns) {
      if (town.connectedTowns.length === 0) {
        // 找到最近的小镇并连接
        let closestTown = null;
        let minDistance = Infinity;
        
        for (const otherTown of this.towns) {
          if (town !== otherTown) {
            const distance = town.distanceTo(otherTown);
            if (distance < minDistance) {
              minDistance = distance;
              closestTown = otherTown;
            }
          }
        }
        
        if (closestTown) {
          town.connectTo(closestTown);
        }
      }
    }
    
    // 添加一些额外的连接，确保有多条路径
    const maxConnections = Math.min(this.towns.length - 1, 3); // 最多3个连接
    
    for (const town of this.towns) {
      // 如果连接数少于最大值，尝试添加连接
      if (town.connectedTowns.length < maxConnections) {
        // 按距离排序的其他小镇
        const otherTowns = this.towns
          .filter(t => t !== town && !town.connectedTowns.includes(t))
          .sort((a, b) => town.distanceTo(a) - town.distanceTo(b));
        
        // 连接最近的未连接小镇
        const connectCount = Math.min(
          maxConnections - town.connectedTowns.length,
          otherTowns.length
        );
        
        for (let i = 0; i < connectCount; i++) {
          town.connectTo(otherTowns[i]);
        }
      }
    }
  }
  
  // 获取所有小镇
  getAllTowns() {
    return this.towns;
  }
  
  // 获取特定小镇
  getTownById(townId) {
    return this.towns.find(town => town.id === townId);
  }
  
  // 获取有效迁移目标
  getValidMigrationTargets(sourceTownId, perceptionValue) {
    const sourceTown = this.getTownById(sourceTownId);
    if (!sourceTown) return [];
    
    // 计算最大迁移步数
    const maxSteps = Math.floor(perceptionValue / 10) + 1;
    
    // 使用广度优先搜索找出在最大步数内的所有小镇
    const visited = new Set([sourceTownId]);
    const targets = [];
    let currentLevel = [sourceTown];
    
    for (let step = 1; step <= maxSteps; step++) {
      const nextLevel = [];
      
      for (const town of currentLevel) {
        for (const connectedTown of town.connectedTowns) {
          if (!visited.has(connectedTown.id)) {
            visited.add(connectedTown.id);
            targets.push({
              town: connectedTown,
              steps: step,
              courageCost: 1 + (step * 2) // 勇气消耗 = 1 + (小镇距离 * 2)
            });
            nextLevel.push(connectedTown);
          }
        }
      }
      
      currentLevel = nextLevel;
    }
    
    return targets;
  }
  
  // 迁移角色到新小镇
  migrateCharacter(character, targetTownId) {
    const sourceTown = this.getTownById(character.townId);
    const targetTown = this.getTownById(targetTownId);
    
    if (!sourceTown || !targetTown) return false;
    
    // 检查目标小镇是否可达
    const targets = this.getValidMigrationTargets(character.townId, character.perception);
    const targetInfo = targets.find(t => t.town.id === targetTownId);
    
    if (!targetInfo) return false;
    
    // 检查勇气值是否足够
    if (character.courage < targetInfo.courageCost) return false;
    
    // 执行迁移
    character.courage -= targetInfo.courageCost; // 消耗勇气
    
    // 更新小镇繁荣度
    sourceTown.removeResident(character.wisdom);
    targetTown.addResident(character.wisdom);
    
    // 更新角色所属小镇
    character.townId = targetTownId;
    
    return true;
  }
  
  // 显示所有小镇
  displayTowns(p) {
    // 先绘制连接线
    for (const town of this.towns) {
      town.displayConnections(p);
    }
    
    // 再绘制小镇
    for (const town of this.towns) {
      town.display(p);
    }
  }
}

// 导出小镇管理器实例
const townManager = new TownManager();
