// 认证模块
(function () {
  // 认证服务API地址
  const AUTH_API = 'https://doc-auth.flatland.app';

  // 调试标志 - 设置为true可以在控制台看到更多日志
  const DEBUG = true;

  // 日志函数
  function log(...args) {
    if (DEBUG) {
      console.log('[Auth]', ...args);
    }
  }

  // 检查用户是否已认证
  function isAuthenticated() {
    try {
      // 尝试从两个可能的键名获取认证数据
      let authData = localStorage.getItem('flatland-auth');

      // 如果没有找到，尝试旧的键名
      if (!authData) {
        authData = localStorage.getItem('flatworld-auth');

        // 如果找到了旧键名的数据，迁移到新键名
        if (authData) {
          localStorage.setItem('flatland-auth', authData);
          localStorage.removeItem('flatworld-auth');
          log('已将认证数据从旧键名迁移到新键名');
        }
      }

      log('检查认证状态, 存储数据:', authData);

      if (!authData) return false;

      const { expireAt } = JSON.parse(authData);
      const now = Date.now();
      const isValid = expireAt > now;

      log('认证有效期检查:', { expireAt, now, isValid });
      return isValid;
    } catch (e) {
      console.error('检查认证状态出错:', e);
      return false;
    }
  }

  // 执行认证流程
  async function authenticate() {
    log('开始认证流程');

    // 强制弹出提示框
    try {
      // 使用setTimeout确保prompt不会被浏览器阻止
      setTimeout(() => {
        log('显示访问码输入框');
        const code = window.prompt('请输入访问码:');

        if (!code) {
          log('用户取消输入访问码');
          return;
        }

        // 使用本地验证方法处理输入的访问码
        handleAuthCode(code);
      }, 100);

      return true; // 返回true表示认证流程已启动
    } catch (e) {
      console.error('显示提示框失败:', e);
      alert('无法显示认证对话框，请尝试刷新页面或使用其他浏览器');
      return false;
    }
  }

  // 处理认证码
  async function handleAuthCode(code) {
    if (!code) return false;

    try {
      log('正在尝试认证...');

      // 首先尝试本地验证
      const validCodes = [
        '8FpbQktwX00v4ibfx4Ta', // 到2024-12-31
        'XANFp5VBeNfmhkxo7EWr', // 到2024-06-30
        'Q0ebZra96sYUnqngAug1'  // 到2024-06-30
      ];

      if (validCodes.includes(code)) {
        log('本地验证成功');

        // 设置7天的过期时间
        const expireAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

        localStorage.setItem('flatland-auth', JSON.stringify({
          expireAt: expireAt,
          timestamp: Date.now(),
          localAuth: true // 标记为本地认证
        }));

        alert('认证成功！');

        // 刷新页面以应用新的认证状态
        setTimeout(() => {
          location.reload();
        }, 500);

        return true;
      }

      // 如果本地验证失败，尝试远程验证
      log('本地验证失败，尝试远程验证...');

      try {
        // 添加超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        // 发送认证请求
        const response = await fetch(AUTH_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ code }),
          signal: controller.signal,
          mode: 'cors' // 明确指定CORS模式
        });

        // 清除超时计时器
        clearTimeout(timeoutId);

        // 处理响应
        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            // 设置认证数据
            const expireTime = data.expireAt || (Date.now() + 7 * 24 * 60 * 60 * 1000);

            localStorage.setItem('flatland-auth', JSON.stringify({
              expireAt: expireTime,
              timestamp: Date.now()
            }));

            alert('认证成功！');

            // 刷新页面以应用新的认证状态
            setTimeout(() => {
              location.reload();
            }, 500);

            return true;
          }
        }

        // 如果远程验证失败
        alert('访问码无效或已过期');
        return false;
      } catch (error) {
        log('远程验证失败:', error);
        alert('远程验证失败，请检查网络连接或稍后重试');
        return false;
      }
    } catch (e) {
      console.error('认证处理失败:', e);
      alert('认证过程出错，请稍后重试');
      return false;
    }
  }



  // 清除认证数据
  function clearAuth() {
    log('清除认证数据');
    localStorage.removeItem('flatland-auth');
    localStorage.removeItem('flatworld-auth'); // 同时清除旧键名
    alert('认证数据已清除，页面将刷新');
    location.reload();
  }

  // 将清除认证函数暴露到全局，以便用户可以手动清除
  window.clearFlatlandAuth = clearAuth;

  // 直接注册到 window.$docsify 对象
  // 这确保了即使 docsify 尚未完全初始化，我们的插件也会被正确注册
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = window.$docsify.plugins || [];

  // 添加我们的认证插件
  window.$docsify.plugins.push(function(hook) {
    log('认证插件已注册');

    // 在初始化时检查认证状态
    hook.init(function() {
      log('Docsify 初始化，检查认证状态');

      // 添加认证状态指示器和认证按钮
      setTimeout(function() {
        const nav = document.querySelector('.app-nav') || document.querySelector('nav');

        if (nav) {
          // 创建认证状态容器
          const authContainer = document.createElement('div');
          authContainer.className = 'auth-status-container';
          authContainer.style.display = 'inline-block';
          authContainer.style.marginRight = '15px';

          // 更新认证状态显示
          function updateAuthStatus() {
            const isAuth = isAuthenticated();
            authContainer.innerHTML = `
              <span class="auth-status ${isAuth ? 'auth-status-ok' : 'auth-status-error'}"
                    title="${isAuth ? '已认证' : '未认证'}">
                ${isAuth ? '🔓' : '🔒'}
              </span>
              <button class="auth-nav-button" onclick="${isAuth ? 'window.clearFlatlandAuth()' : 'window.startFlatlandAuth()'}">
                ${isAuth ? '清除认证' : '认证'}
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

      // 如果用户未认证，自动触发认证流程
      if (!isAuthenticated()) {
        log('用户未认证，自动触发认证流程');
        // 使用setTimeout确保不会阻塞Docsify初始化
        setTimeout(function() {
          authenticate();
        }, 1500);
      } else {
        log('用户已认证，继续初始化');
      }
    });

    // 在每个页面准备渲染前检查认证状态
    hook.beforeEach(function(content) {
      log('页面加载前检查认证状态');

      // 如果用户未认证，在内容底部添加认证提示，但仍然显示内容
      if (!isAuthenticated()) {
        log('用户未认证，添加认证提示');

        // 添加认证提示
        const authNotice = `

---

## 认证提示

您当前正在以未认证状态查看文档。某些功能可能受限。

<button onclick="window.startFlatlandAuth()" class="auth-button">立即认证</button>

<style>
.auth-button {
  padding: 8px 16px;
  margin: 5px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.auth-button:hover {
  background-color: #3aa776;
}
</style>`;

        return content + authNotice;
      }

      log('用户已认证，显示页面内容');
      return content;
    });
  });

  // 初始检查
  log('auth.js 已加载，初始认证状态:', isAuthenticated() ? '已认证' : '未认证');

  // 将认证函数暴露到全局，以便用户可以手动触发认证
  window.startFlatlandAuth = authenticate;

  // 在页面加载完成后检查认证状态
  window.addEventListener('load', function() {
    log('页面加载完成，检查认证状态');

    if (!isAuthenticated()) {
      log('用户未认证，显示认证提示');

      // 创建一个固定在页面顶部的认证提示
      const authBanner = document.createElement('div');
      authBanner.className = 'auth-banner';
      authBanner.innerHTML = `
        <div class="auth-banner-content">
          <span>您当前正在以未认证状态查看文档。某些功能可能受限。</span>
          <button onclick="window.startFlatlandAuth()" class="auth-banner-button">立即认证</button>
          <button onclick="this.parentNode.parentNode.style.display='none'" class="auth-banner-close">×</button>
        </div>
      `;

      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .auth-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: #f8f8f8;
          border-bottom: 1px solid #e8e8e8;
          z-index: 1000;
          padding: 10px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .auth-banner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          max-width: 800px;
          margin: 0 auto;
        }
        .auth-banner-button {
          margin-left: 15px;
          padding: 5px 10px;
          background-color: #42b983;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .auth-banner-button:hover {
          background-color: #3aa776;
        }
        .auth-banner-close {
          margin-left: 15px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
        }
        .auth-banner-close:hover {
          color: #666;
        }
      `;
      document.head.appendChild(style);

      // 添加到页面
      document.body.insertBefore(authBanner, document.body.firstChild);

      // 调整页面内容的上边距，避免被横幅遮挡
      setTimeout(function() {
        const mainContent = document.querySelector('.content') || document.querySelector('main');
        if (mainContent) {
          const bannerHeight = authBanner.offsetHeight;
          mainContent.style.marginTop = (bannerHeight + 10) + 'px';
        }
      }, 100);
    }
  });
})();
