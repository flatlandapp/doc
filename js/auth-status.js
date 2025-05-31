// 认证状态指示器 - 简化版本
(function() {
  console.log('[AuthStatus] 认证状态指示器加载');

  // 检查用户是否已认证 - 不再检查过期时间，但检查认证版本
  function isAuthenticated() {
    try {
      // 当前认证版本，用于使旧的认证失效
      const CURRENT_AUTH_VERSION = '2025-05-31';

      const authData = localStorage.getItem('flatland-auth');
      if (!authData) return false;

      const authObj = JSON.parse(authData);

      // 检查认证版本，如果版本不匹配则清除旧认证
      if (!authObj.version || authObj.version !== CURRENT_AUTH_VERSION) {
        console.log('[AuthStatus] 认证版本过期，清除旧认证数据');
        localStorage.removeItem('flatland-auth');
        localStorage.removeItem('flatworld-auth');
        return false;
      }

      // 检查是否是临时认证或本地认证
      const isTemporary = authObj.temporary === true;
      const isLocal = authObj.localAuth === true;
      const isPermanent = authObj.permanent === true;

      return {
        valid: true,
        temporary: isTemporary,
        local: isLocal,
        permanent: isPermanent
      };
    } catch (e) {
      console.error('[AuthStatus] 检查认证状态出错:', e);
      // 如果解析出错，清除可能损坏的认证数据
      localStorage.removeItem('flatland-auth');
      localStorage.removeItem('flatworld-auth');
      return false;
    }
  }

  // 添加认证状态指示器
  function addAuthStatusIndicator() {
    console.log('[AuthStatus] 添加认证状态指示器');

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
          const isLocal = authStatus && authStatus.local;

          // 不再显示过期时间信息
          let expireInfo = '';
          if (isAuth && authStatus.permanent) {
            expireInfo = '(永久有效)';
          }

          // 确定状态图标和文本
          let statusIcon, statusClass, statusText;
          if (!isAuth) {
            statusIcon = '🔒';
            statusClass = 'auth-status-error';
            statusText = '未认证';
          } else if (isTemp) {
            statusIcon = '⏱️';
            statusClass = 'auth-status-temp';
            statusText = '临时认证 ' + expireInfo;
          } else if (isLocal) {
            statusIcon = '🔑';
            statusClass = 'auth-status-local';
            statusText = '本地认证 ' + expireInfo;
          } else {
            statusIcon = '🔓';
            statusClass = 'auth-status-ok';
            statusText = '已认证 ' + expireInfo;
          }

          authContainer.innerHTML = `
            <span class="auth-status ${statusClass}" title="${statusText}">
              ${statusIcon}
            </span>
            <span class="auth-status-text">${statusText}</span>
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
          .auth-status-container {
            display: flex;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .auth-status {
            display: inline-block;
            width: 20px;
            height: 20px;
            line-height: 20px;
            text-align: center;
            margin-right: 5px;
          }
          .auth-status-text {
            font-size: 12px;
            margin-right: 10px;
            white-space: nowrap;
          }
          .auth-status-ok {
            color: #42b983;
          }
          .auth-status-local {
            color: #409eff;
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
