(function () {
  const AUTH_API = 'https://doc-auth.flatland.app';

  function isAuthenticated() {
    const authData = localStorage.getItem('flatworld-auth');
    if (!authData) return false;

    try {
      const { expireAt } = JSON.parse(authData);
      return expireAt > Date.now();
    } catch (e) {
      return false;
    }
  }

  async function authenticate() {
    const code = prompt('请输入访问码:');
    if (!code) return false;

    try {
      console.log('正在尝试认证，API地址:', AUTH_API);

      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      console.log('认证响应状态:', response.status);

      const data = await response.json();
      console.log('认证响应数据:', data);

      if (data.success) {
        localStorage.setItem('flatworld-auth', JSON.stringify({
          expireAt: data.expireAt
        }));
        return true;
      }

      alert('访问码无效或已过期');
      return false;
    } catch (e) {
      console.error('认证失败:', e);
      // 提供更详细的错误信息
      if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        alert('无法连接到认证服务，请检查网络连接或联系管理员');
      } else {
        alert('认证服务出错，请稍后重试。错误详情: ' + e.message);
      }
      return false;
    }
  }

  window.$docsify.plugins = [].concat(window.$docsify.plugins, function (hook) {
    hook.beforeEach(async function (content) {
      if (!isAuthenticated()) {
        const authenticated = await authenticate();
        if (!authenticated) {
          return '# 访问受限\n\n请刷新页面重新输入正确的访问码。';
        }
      }
      return content;
    });
  });
})();
