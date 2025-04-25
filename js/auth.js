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
      const authData = localStorage.getItem('flatworld-auth');
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
    const code = prompt('请输入访问码:');
    if (!code) {
      log('用户取消输入访问码');
      return false;
    }

    try {
      log('正在尝试认证...');

      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      // 发送认证请求
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        signal: controller.signal,
        mode: 'cors' // 明确指定CORS模式
      });

      // 清除超时计时器
      clearTimeout(timeoutId);

      log('认证响应状态:', response.status);

      // 处理非成功状态码
      if (!response.ok) {
        if (response.status === 401) {
          alert('访问码无效或已过期');
          return false;
        }

        throw new Error(`服务器返回错误状态码: ${response.status}`);
      }

      // 解析响应数据
      const data = await response.json();
      log('认证响应数据:', data);

      // 处理成功响应
      if (data.success) {
        const authData = {
          expireAt: data.expireAt,
          timestamp: Date.now()
        };

        localStorage.setItem('flatworld-auth', JSON.stringify(authData));
        log('认证成功，已保存认证数据:', authData);
        return true;
      }

      // 处理失败响应
      alert(data.error || '访问码无效或已过期');
      return false;
    } catch (e) {
      console.error('认证失败:', e);

      // 提供详细的错误信息
      if (e.name === 'AbortError') {
        alert('认证请求超时，请检查网络连接或稍后重试');
      } else if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        alert('无法连接到认证服务，请检查网络连接或联系管理员');
      } else if (e instanceof SyntaxError) {
        alert('认证服务返回了无效的数据格式，请联系管理员');
      } else {
        alert('认证服务出错，请稍后重试');
      }
      return false;
    }
  }

  // 直接注册到 window.$docsify 对象
  // 这确保了即使 docsify 尚未完全初始化，我们的插件也会被正确注册
  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = window.$docsify.plugins || [];

  // 添加我们的认证插件
  window.$docsify.plugins.push(function(hook) {
    log('认证插件已注册');

    // 在每个页面加载前检查认证状态
    hook.beforeEach(async function(content) {
      log('页面加载前检查认证状态');

      if (!isAuthenticated()) {
        log('用户未认证，开始认证流程');
        try {
          const authenticated = await authenticate();
          if (!authenticated) {
            log('认证失败，显示访问受限页面');
            return '# 访问受限\n\n请刷新页面重新输入正确的访问码。';
          }
          log('认证成功，继续加载页面');
        } catch (error) {
          console.error('认证过程出错:', error);
          return '# 认证服务出错\n\n请刷新页面重试，或联系管理员。';
        }
      } else {
        log('用户已认证，直接加载页面');
      }

      return content;
    });
  });

  // 初始检查
  log('auth.js 已加载，初始认证状态:', isAuthenticated() ? '已认证' : '未认证');
})();
