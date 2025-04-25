// 认证状态指示器
(function() {
  // 调试标志
  const DEBUG = true;
  
  // 日志函数
  function log(...args) {
    if (DEBUG) {
      console.log('[AuthStatus]', ...args);
    }
  }
  
  // 检查用户是否已认证
  function isAuthenticated() {
    try {
      const authData = localStorage.getItem('flatland-auth');
      
      if (!authData) return false;
      
      const authObj = JSON.parse(authData);
      
      // 检查认证是否过期
      if (authObj.expireAt && authObj.expireAt < Date.now()) {
        return false;
      }
      
      // 检查是否是临时认证
      const isTemporary = authObj.temporary === true;
      
      return { valid: true, temporary: isTemporary };
    } catch (e) {
      console.error('检查认证状态出错:', e);
      return false;
    }
  }
  
  // 添加认证状态指示器
  function addAuthStatusIndicator() {
    log('添加认证状态指示器');
    
    // 等待导航栏加载完成
    const checkNav = setInterval(() => {
      const nav = document.querySelector('.app-nav') || document.querySelector('nav');
      
      if (nav) {
        clearInterval(checkNav);
        
        // 创建认证状态容器
        const authContainer = document.createElement('div');
        authContainer.className = 'auth-status-container';
        authContainer.style.display = 'inline-block';
        authContainer.style.marginRight = '15px';
        
        // 更新认证状态显示
        function updateAuthStatus() {
          const authStatus = isAuthenticated();
          const isAuth = authStatus && authStatus.valid;
          const isTemp = authStatus && authStatus.temporary;
          
          authContainer.innerHTML = `
            <span class="auth-status ${isAuth ? (isTemp ? 'auth-status-temp' : 'auth-status-ok') : 'auth-status-error'}" 
                  title="${isAuth ? (isTemp ? '临时认证' : '已认证') : '未认证'}">
              ${isAuth ? (isTemp ? '⏱️' : '🔓') : '🔒'}
            </span>
            <button class="auth-nav-button" onclick="window.clearFlatlandAuth()">
              清除认证
            </button>
          `;
        }
        
        // 初始更新
        updateAuthStatus();
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
          .auth-status {
            display: inline-block;
            width: 20px;
            height: 20px;
            line-height: 20px;
            text-align: center;
            border-radius: 50%;
            margin-right: 5px;
          }
          .auth-status-ok {
            color: #42b983;
          }
          .auth-status-temp {
            color: #e6a23c;
          }
          .auth-status-error {
            color: #f56c6c;
          }
          .auth-nav-button {
            padding: 2px 8px;
            background-color: #42b983;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }
          .auth-nav-button:hover {
            background-color: #3aa776;
          }
        `;
        document.head.appendChild(style);
        
        // 将认证状态容器添加到导航栏
        nav.insertBefore(authContainer, nav.firstChild);
        
        // 每5秒更新一次认证状态
        setInterval(updateAuthStatus, 5000);
      }
    }, 1000);
  }
  
  // 在页面加载完成后添加认证状态指示器
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAuthStatusIndicator);
  } else {
    addAuthStatusIndicator();
  }
})();
