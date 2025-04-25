// 认证模块
(function () {
  // 认证服务API地址
  const AUTH_API = 'https://doc-auth.flatland.app';

  // 检查用户是否已认证
  function isAuthenticated() {
    try {
      const authData = localStorage.getItem('flatworld-auth');
      if (!authData) return false;

      const { expireAt } = JSON.parse(authData);
      return expireAt > Date.now();
    } catch (e) {
      console.error('检查认证状态出错:', e);
      return false;
    }
  }

  // 执行认证流程
  async function authenticate() {
    const code = prompt('请输入访问码:');
    if (!code) return false;

    try {
      console.log('正在尝试认证...');

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

      console.log('认证响应状态:', response.status);

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
      console.log('认证响应数据:', data);

      // 处理成功响应
      if (data.success) {
        localStorage.setItem('flatworld-auth', JSON.stringify({
          expireAt: data.expireAt,
          timestamp: Date.now()
        }));
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

  // 等待docsify初始化完成
  document.addEventListener('DOMContentLoaded', function() {
    // 确保docsify已加载
    if (window.$docsify) {
      // 注册插件
      window.$docsify.plugins = [].concat(window.$docsify.plugins || [], function (hook) {
        hook.beforeEach(async function (content) {
          if (!isAuthenticated()) {
            try {
              const authenticated = await authenticate();
              if (!authenticated) {
                return '# 访问受限\n\n请刷新页面重新输入正确的访问码。';
              }
            } catch (error) {
              console.error('认证过程出错:', error);
              return '# 认证服务出错\n\n请刷新页面重试，或联系管理员。';
            }
          }
          return content;
        });
      });
    } else {
      console.error('docsify未初始化，认证插件无法加载');
    }
  });
})();
