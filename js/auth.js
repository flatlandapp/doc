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
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
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
      alert('认证服务出错，请稍后重试');
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
