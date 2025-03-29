/**
 * Flatland虚拟小镇仿真主程序
 * 基于p5.js实现绘图和交互功能
 */

// 全局变量
let canvas;
let simulation;
let tooltip = null;
let isInitialized = false;
let lastEventTime = 0;
const EVENT_INTERVAL = 10000; // 10秒产生一个随机事件
let showDebugInfo = false;

// P5.js 设置函数
function setup() {
  // 创建画布并放入容器
  const container = document.getElementById('canvas-container');
  canvas = createCanvas(800, 500);
  canvas.parent(container);
  
  // 初始化仿真环境
  simulation = new Simulation();
  simulation.initialize();
  
  // 注册鼠标点击事件
  canvas.mousePressed(handleMousePressed);
  
  // 注册鼠标移动事件
  canvas.mouseMoved(handleMouseMoved);
  
  // 更新界面信息
  updateTownInfo();
  updateEventLog();
  
  isInitialized = true;
}

// P5.js 绘制函数 - 每帧执行
function draw() {
  if (!isInitialized) return;
  
  // 更新仿真
  simulation.update();
  
  // 清除背景
  background('#ffecd1');
  
  // 绘制网格
  drawGrid();
  
  // 绘制小镇
  simulation.townManager.displayTowns(this);
  
  // 绘制角色
  for (const character of simulation.characterManager.characters) {
    character.display(this);
  }
  
  // 绘制提示框
  if (tooltip) {
    drawTooltip(tooltip.text, tooltip.x, tooltip.y);
  }
  
  // Debug信息
  if (showDebugInfo) {
    drawDebugInfo();
  }
  
  // 定期生成随机事件
  if (millis() - lastEventTime > EVENT_INTERVAL) {
    simulation.generateRandomEvent();
    lastEventTime = millis();
    updateEventLog();
  }
  
  // 周期性更新界面信息
  if (frameCount % 60 === 0) { // 每秒更新一次
    updateTownInfo();
    updateSelectedCharacterInfo();
  }
}

// 绘制背景网格
function drawGrid() {
  stroke(220, 220, 220, 100);
  strokeWeight(1);
  
  const gridSize = 40;
  
  for (let x = 0; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  
  for (let y = 0; y < height; y += gridSize) {
    line(0, y, width, y);
  }
}

  // 绘制工具提示
function drawTooltip(tooltipText, x, y) {
  push();
  fill('rgba(38, 70, 83, 0.9)');
  noStroke();
  rectMode(CENTER);
  const tooltipWidth = textWidth(tooltipText) + 20;
  rect(x, y - 20, tooltipWidth, 30, 6);
  
  // 绘制小三角形指向
  triangle(
    x, y - 5,
    x - 10, y - 15,
    x + 10, y - 15
  );
  
  // 绘制文本
  fill(255);
  textAlign(CENTER, CENTER);
  text(tooltipText, x, y - 20);
  pop();
}

// 处理鼠标点击事件
function handleMousePressed() {
  // 检查是否点击了角色
  const selectedCharacter = simulation.characterManager.selectCharacter(mouseX, mouseY);
  
  if (selectedCharacter) {
    // 更新右侧面板中的角色信息
    updateSelectedCharacterInfo(selectedCharacter);
  } else {
    // 随机移动一个角色（仅用于演示）
    if (simulation.characterManager.characters.length > 0) {
      const randomIndex = Math.floor(Math.random() * simulation.characterManager.characters.length);
      const character = simulation.characterManager.characters[randomIndex];
      character.setTarget(mouseX, mouseY);
    }
  }
}

// 处理鼠标移动事件
function handleMouseMoved() {
  // 检查鼠标是否悬停在角色上
  let hoveredCharacter = null;
  for (const character of simulation.characterManager.characters) {
    if (character.contains(mouseX, mouseY)) {
      hoveredCharacter = character;
      break;
    }
  }
  
  if (hoveredCharacter) {
    // 显示角色信息提示
    tooltip = {
      text: `${hoveredCharacter.type === CHARACTER_TYPE.TRIANGLE ? "三角形" : 
             hoveredCharacter.type === CHARACTER_TYPE.SQUARE ? "正方形" : 
             hoveredCharacter.type === CHARACTER_TYPE.DIAMOND ? "菱形" : 
             "圆形"} - ${hoveredCharacter.profession}`,
      x: mouseX,
      y: mouseY
    };
  } else {
    // 检查是否悬停在小镇上
    let hoveredTown = null;
    for (const town of simulation.townManager.towns) {
      const distance = dist(mouseX, mouseY, town.x, town.y);
      if (distance < town.size / 2) {
        hoveredTown = town;
        break;
      }
    }
    
    if (hoveredTown) {
      // 显示小镇信息提示
      tooltip = {
        text: `${hoveredTown.name} - ${hoveredTown.translateTownType(hoveredTown.type)} - 居民: ${hoveredTown.population}`,
        x: mouseX,
        y: mouseY
      };
    } else {
      tooltip = null;
    }
  }
}

// 更新小镇信息面板
function updateTownInfo() {
  const townStatsElement = document.getElementById('town-stats');
  if (!townStatsElement) return;
  
  let statsHTML = '';
  
  for (const town of simulation.townManager.towns) {
    statsHTML += `
      <div class="ghibli-card">
        <h3>${town.name}</h3>
        <div class="town-stats-details">
          <div class="stat-item">
            <div class="stat-value">${town.population}</div>
            <div class="stat-label">居民</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${Math.floor(town.prosperity)}</div>
            <div class="stat-label">繁荣度</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${town.translateTownType(town.type)}</div>
            <div class="stat-label">类型</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${town.translateTerrainType(town.terrain.type)}</div>
            <div class="stat-label">地形</div>
          </div>
        </div>
      </div>
    `;
  }
  
  townStatsElement.innerHTML = statsHTML;
}

// 更新事件日志面板
function updateEventLog() {
  const eventLogElement = document.getElementById('event-log-content');
  if (!eventLogElement) return;
  
  let logHTML = '';
  
  // 获取最近10个事件
  const events = simulation.eventManager.events
    .slice(-10)
    .reverse();
  
  for (const event of events) {
    const details = event.getDetails();
    const statusText = event.resolved ? 
      `<span style="color: #2a9d8f">已解决 (${details.outcome})</span>` : 
      '<span style="color: #e76f51">进行中</span>';
    
    logHTML += `
      <div class="event-item">
        <div class="event-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
        <div class="event-description">
          <strong>${details.type}:</strong> ${event.title} - ${statusText}
        </div>
      </div>
    `;
  }
  
  eventLogElement.innerHTML = logHTML;
}

// 更新选中角色信息面板
function updateSelectedCharacterInfo(character) {
  const selectedCharElement = document.getElementById('selected-character');
  if (!selectedCharElement) return;
  
  if (!character) {
    character = simulation.characterManager.getSelectedCharacter();
  }
  
  if (!character) {
    selectedCharElement.innerHTML = '<p>点击一个居民查看详情</p>';
    return;
  }
  
  const details = character.getDetails();
  const agent = simulation.aiAgentManager.getAgent(character.id);
  let agentDetails = {};
  
  if (agent) {
    agentDetails = agent.getDetails();
  }
  
  selectedCharElement.innerHTML = `
    <div class="character-portrait">
      ${renderCharacterShape(character)}
    </div>
    <div class="character-info">
      <div class="info-label">类型:</div>
      <div class="info-value">${details.type}</div>
      
      <div class="info-label">社会阶层:</div>
      <div class="info-value">${details.socialClass}</div>
      
      <div class="info-label">职业:</div>
      <div class="info-value">${details.profession}</div>
      
      <div class="info-label">边数:</div>
      <div class="info-value">${details.edges}</div>
      
      <div class="info-label">性别:</div>
      <div class="info-value">${details.gender}</div>
      
      <div class="info-label">行为倾向:</div>
      <div class="info-value">${agentDetails.behaviorTendency || '未知'}</div>
      
      <div class="info-label">最近决策:</div>
      <div class="info-value">${agentDetails.lastDecisionType || '无'}</div>
      
      <div class="info-label">勇气:</div>
      <div class="info-value">${details.courage}</div>
      <div class="attr-bar"><div class="attr-fill attr-courage" style="width: ${details.courage}%;"></div></div>
      
      <div class="info-label">智慧:</div>
      <div class="info-value">${details.wisdom}</div>
      <div class="attr-bar"><div class="attr-fill attr-wisdom" style="width: ${details.wisdom}%;"></div></div>
      
      <div class="info-label">感知:</div>
      <div class="info-value">${details.perception}</div>
      <div class="attr-bar"><div class="attr-fill attr-perception" style="width: ${details.perception}%;"></div></div>
      
      <div class="info-label">爱好:</div>
      <div class="info-value">${details.hobbies}</div>
      
      <div class="info-label">背景:</div>
      <div class="info-value" style="grid-column: span 2;">${details.story}</div>
    </div>
  `;
}

// 渲染角色形状（用于信息面板）
function renderCharacterShape(character) {
  // 创建临时canvas来绘制角色
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 100;
  tempCanvas.height = 100;
  const ctx = tempCanvas.getContext('2d');
  
  // 设置样式
  ctx.fillStyle = character.color;
  
  // 居中绘制
  ctx.translate(50, 50);
  
  // 根据类型绘制形状
  if (character.type === CHARACTER_TYPE.TRIANGLE) {
    // 绘制三角形
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI * 2 * i / 3 - Math.PI / 2;
      const x = Math.cos(angle) * character.size/2;
      const y = Math.sin(angle) * character.size/2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  } else if (character.type === CHARACTER_TYPE.SQUARE) {
    // 绘制正方形
    const halfSize = character.size / 2;
    ctx.fillRect(-halfSize, -halfSize, character.size, character.size);
  } else if (character.type === CHARACTER_TYPE.DIAMOND) {
    // 绘制菱形
    ctx.beginPath();
    ctx.moveTo(0, -character.size/2);
    ctx.lineTo(character.size/2, 0);
    ctx.lineTo(0, character.size/2);
    ctx.lineTo(-character.size/2, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // 绘制圆形
    ctx.beginPath();
    ctx.arc(0, 0, character.size/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
  
  return `<img src="${tempCanvas.toDataURL()}" alt="Character Shape" style="width: 100%; height: 100%;">`;
}

// 绘制Debug信息
function drawDebugInfo() {
  push();
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  
  const info = [
    `FPS: ${Math.round(frameRate())}`,
    `Entities: ${simulation.characterManager.characters.length}`,
    `Towns: ${simulation.townManager.towns.length}`,
    `Events: ${simulation.eventManager.events.length}`,
    `Active Events: ${simulation.eventManager.getActiveEvents().length}`,
    `Resolved Events: ${simulation.eventManager.getResolvedEvents().length}`
  ];
  
  for (let i = 0; i < info.length; i++) {
    text(info[i], 10, 10 + i * 20);
  }
  pop();
}

// 切换Debug信息显示
function toggleDebugInfo() {
  showDebugInfo = !showDebugInfo;
}

// 添加更多居民
function addMoreResidents(count = 10) {
  simulation.addCharacters(count);
  updateTownInfo();
}

// 生成随机事件
function triggerRandomEvent() {
  const event = simulation.generateRandomEvent();
  updateEventLog();
  
  // 显示事件通知
  if (event) {
    showEventNotification(event);
  }
}

// 显示事件通知
function showEventNotification(event) {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'event-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <h3>${event.title}</h3>
      <p>${event.description}</p>
    </div>
  `;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 添加活跃类激活动画
  setTimeout(() => {
    notification.classList.add('active');
  }, 10);
  
  // 一段时间后移除通知
  setTimeout(() => {
    notification.classList.remove('active');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 5000);
  
  // 高亮参与事件的角色
  event.participants.forEach(participantId => {
    const character = simulation.characterManager.characters.find(c => c.id === participantId);
    if (character) {
      // 添加视觉效果
      character.highlighted = true;
      
      // 5秒后移除高亮
      setTimeout(() => {
        character.highlighted = false;
      }, 5000);
    }
  });
}

// 仿真类，组织管理所有系统
class Simulation {
  constructor() {
    this.characterManager = characterManager;
    this.townManager = townManager;
    this.eventManager = eventManager;
    this.aiAgentManager = aiAgentManager;
  }
  
  // 初始化仿真环境
  initialize() {
    // 创建几个小镇
    this.townManager.createTowns(3);
    
    // 为每个小镇创建初始居民
    for (const town of this.townManager.towns) {
      // 每个小镇创建几个居民
      const townResidents = this.characterManager.createCharacters(town.id, 4);
      
      // 分配位置
      for (const character of townResidents) {
        // 在小镇范围内随机位置
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (town.size / 2 - 20);
        character.x = town.x + Math.cos(angle) * distance;
        character.y = town.y + Math.sin(angle) * distance;
        character.targetX = character.x;
        character.targetY = character.y;
        
        // 更新小镇人口和繁荣度
        town.addResident(character.wisdom);
      }
      
      // 为居民创建AI代理
      this.aiAgentManager.createAgentsBatch(townResidents);
    }
    
    // 创建初始事件
    this.generateRandomEvent();
    
    console.log('仿真环境初始化完成');
  }
  
  // 更新仿真
  update() {
    // 更新角色位置
    this.characterManager.updateCharacters();
    
    // 更新AI代理决策
    this.aiAgentManager.updateAgents(this);
    
    // 更新事件
    this.eventManager.updateEvents();
    
    // 应用事件结果
    this.eventManager.applyEventResults(
      this.characterManager,
      this.townManager
    );
  }
  
  // 添加更多角色
  addCharacters(count) {
    // 为每个小镇平均添加居民
    const townsCount = this.townManager.towns.length;
    if (townsCount === 0) return;
    
    const perTownCount = Math.max(1, Math.floor(count / townsCount));
    
    for (const town of this.townManager.towns) {
      const townResidents = this.characterManager.createCharacters(town.id, perTownCount);
      
      // 分配位置
      for (const character of townResidents) {
        // 在小镇范围内随机位置
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (town.size / 2 - 20);
        character.x = town.x + Math.cos(angle) * distance;
        character.y = town.y + Math.sin(angle) * distance;
        character.targetX = character.x;
        character.targetY = character.y;
        
        // 更新小镇人口和繁荣度
        town.addResident(character.wisdom);
      }
      
      // 为居民创建AI代理
      this.aiAgentManager.createAgentsBatch(townResidents);
    }
  }
  
  // 生成随机事件
  generateRandomEvent() {
    const event = this.eventManager.generateRandomEvent(
      this.characterManager,
      this.townManager
    );
    
    if (event) {
      console.log('生成随机事件:', event.title);
    }
    
    return event;
  }
}

// 添加全局函数到window对象，以便HTML按钮调用
window.toggleDebugInfo = toggleDebugInfo;
window.addMoreResidents = addMoreResidents;
window.triggerRandomEvent = triggerRandomEvent;
