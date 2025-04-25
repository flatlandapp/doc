// 简单的重定向脚本
(function() {
  // 检查用户是否已认证
  function isAuthenticated() {
    try {
      const authData = localStorage.getItem('flatland-auth');
      if (!authData) return false;
      
      const authObj = JSON.parse(authData);
      return !(authObj.expireAt && authObj.expireAt < Date.now());
    } catch (e) {
      return false;
    }
  }
  
  // 如果未认证，重定向到登录页面
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
})();
