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

    // 先尝试健康检查，确认认证服务是否可用
    try {
      log('检查认证服务是否可用...');
      const healthCheck = await fetch(`${AUTH_API}?health=1`, {
        method: 'GET',
        mode: 'no-cors' // 使用no-cors模式避免CORS问题
      });
      log('认证服务健康检查结果:', healthCheck.type);
    } catch (e) {
      log('认证服务健康检查失败:', e);
      // 继续尝试认证，不阻止流程
    }

    const code = prompt('请输入访问码:');
    if (!code) {
      log('用户取消输入访问码');
      return false;
    }

    try {
      log('正在尝试认证...');

      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 增加到15秒超时

      // 构建请求URL
      const url = new URL(AUTH_API);

      // 发送认证请求
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ code }),
        signal: controller.signal,
        mode: 'cors', // 明确指定CORS模式
        credentials: 'omit' // 不发送凭据，避免某些CORS问题
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
        // 设置一个较长的过期时间（例如7天）
        const expireTime = data.expireAt || (Date.now() + 7 * 24 * 60 * 60 * 1000);

        const authData = {
          expireAt: expireTime,
          timestamp: Date.now()
        };

        localStorage.setItem('flatland-auth', JSON.stringify(authData));
        log('认证成功，已保存认证数据:', authData);

        // 刷新页面以应用新的认证状态
        setTimeout(() => {
          location.reload();
        }, 500);

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
        // 如果是CORS错误，尝试使用备用方法
        log('尝试使用备用认证方法...');
        return handleCorsError(code);
      } else if (e instanceof SyntaxError) {
        alert('认证服务返回了无效的数据格式，请联系管理员');
      } else {
        alert('认证服务出错，请稍后重试');
      }
      return false;
    }
  }

  // 处理CORS错误的备用方法
  async function handleCorsError(code) {
    log('使用备用方法处理CORS错误');

    // 对于CORS错误，我们可以使用一个简单的本地验证
    // 这不是最安全的方法，但可以作为临时解决方案
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

      // 刷新页面以应用新的认证状态
      setTimeout(() => {
        location.reload();
      }, 500);

      return true;
    }

    alert('访问码无效或已过期');
    return false;
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

      // 如果用户未认证，立即开始认证流程
      if (!isAuthenticated()) {
        log('用户未认证，准备开始认证流程');
        // 使用setTimeout确保不会阻塞Docsify初始化
        setTimeout(async function() {
          log('开始认证流程');
          try {
            await authenticate();
          } catch (error) {
            console.error('认证过程出错:', error);
          }
        }, 500);
      } else {
        log('用户已认证，继续初始化');
      }
    });

    // 在每个页面准备渲染前检查认证状态
    hook.beforeEach(function(content) {
      log('页面加载前检查认证状态');

      // 如果用户未认证，显示访问受限页面
      if (!isAuthenticated()) {
        log('用户未认证，显示访问受限页面');
        return '# 访问受限\n\n您需要有效的访问码才能查看此内容。\n\n<button onclick="location.reload()" class="auth-button">刷新页面重试</button>\n\n如果您遇到认证问题，可以尝试清除认证数据：\n\n<button onclick="window.clearFlatlandAuth()" class="auth-button">清除认证数据</button>\n\n<style>\n.auth-button {\n  padding: 8px 16px;\n  margin: 5px;\n  background-color: #42b983;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n}\n.auth-button:hover {\n  background-color: #3aa776;\n}\n</style>';
      }

      log('用户已认证，显示页面内容');
      return content;
    });
  });

  // 初始检查
  log('auth.js 已加载，初始认证状态:', isAuthenticated() ? '已认证' : '未认证');
})();
