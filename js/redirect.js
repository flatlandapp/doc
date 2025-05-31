// 简单的重定向脚本
(function() {
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
        localStorage.removeItem('flatland-auth');
        localStorage.removeItem('flatworld-auth');
        return false;
      }

      return true;
    } catch (e) {
      // 如果解析出错，清除可能损坏的认证数据
      localStorage.removeItem('flatland-auth');
      localStorage.removeItem('flatworld-auth');
      return false;
    }
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
})();
