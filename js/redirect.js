// 简单的重定向脚本
(function() {
  // 检查用户是否已认证 - 不再检查过期时间
  function isAuthenticated() {
    try {
      const authData = localStorage.getItem('flatland-auth');
      // 只要有认证数据就认为是已认证
      return !!authData;
    } catch (e) {
      return false;
    }
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
})();
