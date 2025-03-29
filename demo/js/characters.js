/**
 * Flatland角色系统
 * 实现了四种不同的角色类型：三角形(战士)、正方形(牧师)、菱形(学者)和圆形(贵族)
 */

// 角色类型枚举
const CHARACTER_TYPE = {
  TRIANGLE: 'triangle', // 战士，工人阶层
  SQUARE: 'square',     // 牧师，中产阶级
  DIAMOND: 'diamond',   // 学者，精英阶层
  CIRCLE: 'circle'      // 贵族，贵族阶层
};

// 角色阶层枚举
const SOCIAL_CLASS = {
  WORKER: '工人阶层',
  MIDDLE: '中产阶级',
  ELITE: '精英阶层',
  NOBLE: '贵族阶层'
};

// 生成随机DNA
function generateDNA() {
  return Math.floor(1 + Math.random() * 580);
}

// 生成随机性别
function generateGender() {
  return Math.random() > 0.5 ? "男" : "女";
}

// 生成随机爱好
function generateHobbies() {
  const possibleHobbies = [
    "绘画", "阅读", "冥想", "探索", "收集", "观星", 
    "计算", "构建", "交流", "歌唱", "舞蹈", "思考",
    "记录", "写作", "讲故事", "辩论", "平衡", "冒险"
  ];
  
  const count = Math.floor(1 + Math.random() * 3); // 1-3个爱好
  const hobbies = [];
  
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * possibleHobbies.length);
    if (!hobbies.includes(possibleHobbies[index])) {
      hobbies.push(possibleHobbies[index]);
    }
  }
  
  return hobbies;
}

// 生成随机职业
function generateProfession(characterType) {
  const professions = {
    [CHARACTER_TYPE.TRIANGLE]: ["矿工", "农民", "建筑工", "士兵"],
    [CHARACTER_TYPE.SQUARE]: ["医师", "教师", "工匠", "商人"],
    [CHARACTER_TYPE.DIAMOND]: ["学者", "发明家", "艺术家", "顾问"],
    [CHARACTER_TYPE.CIRCLE]: ["贵族", "统治者", "哲学家", "法官"]
  };
  
  const options = professions[characterType];
  return options[Math.floor(Math.random() * options.length)];
}

// 生成随机故事背景
function generateStory(characterType, profession, hobbies) {
  // 生成随机名字
  const firstNames = ["小方", "圆圆", "三角", "菱菱", "正方", "多边", "直线", "弧形", "点点", "边边"];
  const lastNames = ["何", "张", "李", "王", "赵", "刘", "周", "吴", "郑", "孙"];
  const name = lastNames[Math.floor(Math.random() * lastNames.length)] + 
               firstNames[Math.floor(Math.random() * firstNames.length)];
  
  const age = Math.floor(20 + Math.random() * 60);
  
  const storyTemplates = [
    `${name}是一名${age}岁的${profession}，喜欢${hobbies.join('和')}。作为一个${characterType === CHARACTER_TYPE.TRIANGLE ? '三角形' : characterType === CHARACTER_TYPE.SQUARE ? '正方形' : characterType === CHARACTER_TYPE.DIAMOND ? '菱形' : '圆形'}，他/她在社会中扮演着重要角色。`,
    `年仅${age}岁的${name}已经成为了一名出色的${profession}。在闲暇时间，他/她喜欢${hobbies.join('和')}来放松自己。`,
    `${name}出生在平面世界的边缘，现在是一名${profession}。${age}年的生活经历让他/她对${hobbies.join('和')}产生了浓厚的兴趣。`
  ];
  
  return storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
}

// 角色基类
class Character {
  constructor(id, townId) {
    this.id = id;
    this.townId = townId;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.size = 30;
    this.selected = false;
    this.highlighted = false;
    
    // 基础属性 (1-99)
    this.courage = 0;      // 勇气
    this.wisdom = 0;       // 智慧
    this.perception = 0;   // 感知
    
    // 社会属性
    this.gender = generateGender();
    this.dna = generateDNA();
    this.hobbies = generateHobbies();
    this.profession = '';
    this.story = '';
    
    // 边数与形状
    this.edges = 0;
    this.type = '';
    this.socialClass = '';
    
    // 颜色
    this.color = '#ffffff';
    this.colorIndex = Math.floor(Math.random() * 16);
    
    // 移动属性
    this.speed = 0.5 + Math.random() * 0.5;
    this.moving = false;
  }
  
  // 初始化随机属性
  initRandomAttributes(minTotal, maxTotal) {
    // 确保三个属性的总和在指定范围内
    let total = minTotal + Math.floor(Math.random() * (maxTotal - minTotal + 1));
    
    // 分配属性点
    let remaining = total;
    
    // 确保每个属性至少有1点
    this.courage = 1;
    this.wisdom = 1;
    this.perception = 1;
    remaining -= 3;
    
    // 随机分配剩余点数
    const courageShare = Math.floor(Math.random() * remaining);
    remaining -= courageShare;
    this.courage += courageShare;
    
    const wisdomShare = Math.floor(Math.random() * remaining);
    remaining -= wisdomShare;
    this.wisdom += wisdomShare;
    
    this.perception += remaining;
    
    // 根据总属性值计算边数
    this.updateEdges();
    
    // 根据边数更新角色类型
    this.updateType();
    
    // 设置职业
    this.profession = generateProfession(this.type);
    
    // 生成故事
    this.story = generateStory(this.type, this.profession, this.hobbies);
  }
  
  // 更新边数
  updateEdges() {
    const totalAttributes = this.courage + this.wisdom + this.perception;
    
    if (totalAttributes <= 150) {
      // 工人阶层: 三角形 (3-50边)
      this.edges = 3 + Math.floor((totalAttributes / 150) * 47);
    } else if (totalAttributes <= 200) {
      // 中产阶级: 四边形 (51-70边)
      this.edges = 51 + Math.floor(((totalAttributes - 151) / 49) * 19);
    } else if (totalAttributes <= 250) {
      // 精英阶层: 多边形 (71-90边)
      this.edges = 71 + Math.floor(((totalAttributes - 201) / 49) * 19);
    } else {
      // 贵族阶层: 接近圆形 (91-99边)
      this.edges = 91 + Math.floor(((totalAttributes - 251) / 46) * 8);
      if (this.edges > 99) this.edges = 99; // 确保不超过99边
    }
  }
  
  // 更新角色类型
  updateType() {
    if (this.edges <= 50) {
      this.type = CHARACTER_TYPE.TRIANGLE;
      this.socialClass = SOCIAL_CLASS.WORKER;
      this.color = '#e76f51'; // 三角形战士颜色
    } else if (this.edges <= 70) {
      this.type = CHARACTER_TYPE.SQUARE;
      this.socialClass = SOCIAL_CLASS.MIDDLE;
      this.color = '#2a9d8f'; // 正方形牧师颜色
    } else if (this.edges <= 90) {
      this.type = CHARACTER_TYPE.DIAMOND;
      this.socialClass = SOCIAL_CLASS.ELITE;
      this.color = '#e9c46a'; // 菱形学者颜色
    } else {
      this.type = CHARACTER_TYPE.CIRCLE;
      this.socialClass = SOCIAL_CLASS.NOBLE;
      this.color = '#264653'; // 圆形贵族颜色
    }
  }
  
  // 绘制角色
  display(p) {
    p.push();
    
    // 移动到角色位置
    p.translate(this.x, this.y);
    
    // 如果被选中，绘制选中效果
    if (this.selected) {
      p.noFill();
      p.stroke('#e29578');
      p.strokeWeight(3);
      p.ellipse(0, 0, this.size + 15, this.size + 15);
    }
    
    // 如果被高亮，添加脉动效果
    if (this.highlighted) {
      // 使用sin函数创建脉动效果
      const pulseScale = 1 + 0.2 * Math.sin(p.frameCount * 0.1);
      const glowSize = this.size * pulseScale;
      
      // 绘制发光效果
      p.noStroke();
      p.fill(255, 255, 0, 100); // 黄色半透明
      p.ellipse(0, 0, glowSize + 20, glowSize + 20);
      
      // 绘制白色边缘
      p.stroke(255);
      p.strokeWeight(2);
      p.noFill();
      p.ellipse(0, 0, this.size + 10, this.size + 10);
    } else {
      p.noStroke();
    }
    
    // 绘制角色形状
    p.fill(this.color);
    
    if (this.type === CHARACTER_TYPE.TRIANGLE) {
      // 绘制三角形
      p.beginShape();
      for (let i = 0; i < 3; i++) {
        const angle = p.TWO_PI * i / 3 - p.PI / 2;
        const x = p.cos(angle) * this.size/2;
        const y = p.sin(angle) * this.size/2;
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
    } else if (this.type === CHARACTER_TYPE.SQUARE) {
      // 绘制正方形
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.size, this.size);
    } else if (this.type === CHARACTER_TYPE.DIAMOND) {
      // 绘制菱形
      p.beginShape();
      p.vertex(0, -this.size/2);
      p.vertex(this.size/2, 0);
      p.vertex(0, this.size/2);
      p.vertex(-this.size/2, 0);
      p.endShape(p.CLOSE);
    } else {
      // 绘制圆形（或高边数多边形）
      p.ellipse(0, 0, this.size, this.size);
    }
    
    p.pop();
  }
  
  // 移动角色
  move() {
    if (this.moving) {
      // 计算与目标的距离
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果已经非常接近目标，直接到达
      if (distance < 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.moving = false;
        return;
      }
      
      // 移动逻辑
      this.x += dx * this.speed / distance;
      this.y += dy * this.speed / distance;
    }
  }
  
  // 设置移动目标
  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
  }
  
  // 检查点是否在角色上
  contains(px, py) {
    const d = Math.sqrt((px - this.x) * (px - this.x) + (py - this.y) * (py - this.y));
    return d < this.size / 2;
  }
  
  // 获取角色详细信息
  getDetails() {
    return {
      id: this.id,
      type: this.type === CHARACTER_TYPE.TRIANGLE ? "三角形(战士)" : 
            this.type === CHARACTER_TYPE.SQUARE ? "正方形(牧师)" : 
            this.type === CHARACTER_TYPE.DIAMOND ? "菱形(学者)" : 
            "圆形(贵族)",
      socialClass: this.socialClass,
      edges: this.edges,
      courage: this.courage,
      wisdom: this.wisdom,
      perception: this.perception,
      gender: this.gender,
      profession: this.profession,
      hobbies: this.hobbies.join(', '),
      story: this.story
    };
  }
}

// 角色工厂 - 创建不同类型的角色
class CharacterFactory {
  static createCharacter(townId, characterCount) {
    const id = `character_${characterCount}`;
    const character = new Character(id, townId);
    
    // 根据角色类型比例分配社会阶层
    const roll = Math.random();
    if (roll < 0.6) { // 60% 工人阶层(三角形)
      character.initRandomAttributes(20, 150);
    } else if (roll < 0.85) { // 25% 中产阶级(正方形)
      character.initRandomAttributes(151, 200);
    } else if (roll < 0.97) { // 12% 精英阶层(菱形)
      character.initRandomAttributes(201, 250);
    } else { // 3% 贵族阶层(圆形)
      character.initRandomAttributes(251, 297);
    }
    
    return character;
  }
}

// 角色管理器
class CharacterManager {
  constructor() {
    this.characters = [];
    this.selectedCharacter = null;
  }
  
  // 创建新角色
  createCharacter(townId) {
    const character = CharacterFactory.createCharacter(townId, this.characters.length);
    this.characters.push(character);
    return character;
  }
  
  // 批量创建角色
  createCharacters(townId, count) {
    const newCharacters = [];
    for (let i = 0; i < count; i++) {
      newCharacters.push(this.createCharacter(townId));
    }
    return newCharacters;
  }
  
  // 获取所有角色
  getAllCharacters() {
    return this.characters;
  }
  
  // 获取特定小镇的角色
  getCharactersByTown(townId) {
    return this.characters.filter(character => character.townId === townId);
  }
  
  // 选择角色
  selectCharacter(x, y) {
    // 先清除之前的选择
    if (this.selectedCharacter) {
      this.selectedCharacter.selected = false;
    }
    
    // 检查是否点击了角色
    for (const character of this.characters) {
      if (character.contains(x, y)) {
        character.selected = true;
        this.selectedCharacter = character;
        return character;
      }
    }
    
    this.selectedCharacter = null;
    return null;
  }
  
  // 获取当前选中的角色
  getSelectedCharacter() {
    return this.selectedCharacter;
  }
  
  // 更新所有角色
  updateCharacters() {
    for (const character of this.characters) {
      character.move();
    }
  }
}

// 导出角色管理器实例
const characterManager = new CharacterManager();
