/**
 * Flatland事件显示系统
 * 负责在界面上显示事件通知和视觉效果
 */

// 为每种事件类型定义描述
const EVENT_DESCRIPTIONS = {
  'knowledge': "两位居民发现了一个古老的知识宝库。他们可以选择合作共同学习，或试图独占知识资源。",
  'resource': "两位居民发现了稀有的几何染料，可用于改变自身颜色。他们需要决定如何分配这一资源。",
  'infrastructure': "小镇需要建设新的公共设施，居民们需要共同投入资源和劳力。每个参与者的贡献都将影响最终结果。",
  'earthquake': "多个小镇发生地震，所有居民需要决定是否参与救援行动。参与救援可能获得勇气提升，但也需要付出努力。",
  'festival': "一年一度的几何艺术节开始了，居民们可以展示自己的几何艺术作品并参与庆典活动。"
};

// 为事件类型定义标题
const EVENT_TITLES = {
  'knowledge': "知识宝库发现",
  'resource': "资源分配挑战",
  'infrastructure': "小镇基础设施建设",
  'earthquake': "跨镇地震救援",
  'festival': "几何艺术节"
};

// 修改EventManager.generateRandomEvent方法，添加事件描述
const originalGenerateRandomEvent = EventManager.prototype.generateRandomEvent;
EventManager.prototype.generateRandomEvent = function(characterManager, townManager) {
  const event = originalGenerateRandomEvent.call(this, characterManager, townManager);
  
  if (event) {
    // 确保事件有标题
    if (!event.title && EVENT_TITLES[event.type]) {
      event.title = EVENT_TITLES[event.type];
    }
    
    // 确保事件有描述
    if (!event.description && EVENT_DESCRIPTIONS[event.type]) {
      event.description = EVENT_DESCRIPTIONS[event.type];
    }
    
    // 显示事件通知
    showEventNotification(event);
  }
  
  return event;
};

// 显示事件通知函数
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
  if (event.participants && event.participants.length > 0) {
    const characters = window.characterManager.characters;
    
    event.participants.forEach(participantId => {
      const character = characters.find(c => c.id === participantId);
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
}

// 修改triggerRandomEvent函数，不再需要重复显示通知
const originalTriggerRandomEvent = window.triggerRandomEvent;
window.triggerRandomEvent = function() {
  const event = simulation.generateRandomEvent();
  updateEventLog();
};
