// 预认证脚本 - 在页面加载前执行认证检查
(function() {
  // 调试标志
  const DEBUG = true;

  // 认证服务API地址
  const AUTH_API = 'https://doc-auth.flatland.app';

  // 日志函数
  function log(...args) {
    if (DEBUG) {
      console.log('[PreAuth]', ...args);
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

      if (!authData) {
        log('检查认证状态，存储数据: null');
        return false;
      }

      // 解析认证数据
      const authObj = JSON.parse(authData);
      log('检查认证状态，存储数据:', authObj);

      // 检查认证是否过期
      if (authObj.expireAt && authObj.expireAt < Date.now()) {
        log('认证已过期');
        localStorage.removeItem('flatland-auth');
        return false;
      }

      return true;
    } catch (e) {
      console.error('检查认证状态出错:', e);
      return false;
    }
  }

  // 执行认证流程
  function authenticate() {
    log('开始认证流程');

    // 创建一个简洁的登录页面
    document.body.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-logo">
            <img src="./logo-xl.png" alt="Flatland AI" />
          </div>
          <h1>Flatland AI 文档</h1>
          <div class="auth-form">
            <h2>请输入访问码</h2>
            <p>您需要有效的访问码才能查看文档内容</p>
            <div class="auth-input-group">
              <input type="text" id="auth-code-input" placeholder="请输入访问码" />
              <button id="auth-submit-btn">访问文档</button>
            </div>
            <div id="auth-message"></div>
          </div>
        </div>
      </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f5f7f9;
        color: #34495e;
      }

      .auth-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }

      .auth-container {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 500px;
        padding: 40px;
        text-align: center;
      }

      .auth-logo {
        margin-bottom: 20px;
      }

      .auth-logo img {
        max-width: 120px;
        height: auto;
      }

      .auth-container h1 {
        margin: 0 0 30px;
        color: #42b983;
        font-size: 24px;
      }

      .auth-form {
        text-align: left;
      }

      .auth-form h2 {
        margin: 0 0 10px;
        font-size: 20px;
        color: #2c3e50;
      }

      .auth-form p {
        margin: 0 0 20px;
        color: #7f8c8d;
      }

      .auth-input-group {
        display: flex;
        margin-bottom: 15px;
      }

      .auth-input-group input {
        flex: 1;
        padding: 12px 15px;
        border: 1px solid #ddd;
        border-radius: 4px 0 0 4px;
        font-size: 16px;
        outline: none;
      }

      .auth-input-group input:focus {
        border-color: #42b983;
      }

      .auth-input-group button {
        padding: 12px 20px;
        background-color: #42b983;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        font-size: 16px;
        cursor: pointer;
        white-space: nowrap;
      }

      .auth-input-group button:hover {
        background-color: #3aa776;
      }

      #auth-message {
        color: #e74c3c;
        min-height: 20px;
        margin-top: 10px;
        font-size: 14px;
      }
    `;

    // 添加样式到页面
    document.head.appendChild(style);

    // 获取元素
    const codeInput = document.getElementById('auth-code-input');
    const submitBtn = document.getElementById('auth-submit-btn');
    const messageEl = document.getElementById('auth-message');

    // 设置焦点
    setTimeout(() => codeInput.focus(), 100);

    // 处理提交
    function handleSubmit() {
      const code = codeInput.value.trim();

      if (!code) {
        messageEl.textContent = '请输入访问码';
        codeInput.focus();
        return;
      }

      messageEl.textContent = '正在验证...';
      submitBtn.disabled = true;
      submitBtn.textContent = '验证中...';

      // 验证访问码
      validateCode(code)
        .then(valid => {
          if (valid) {
            // 认证成功，刷新页面以加载文档
            messageEl.textContent = '认证成功，正在加载文档...';
            messageEl.style.color = '#42b983';
            setTimeout(() => {
              location.reload();
            }, 1000);
          } else {
            messageEl.textContent = '访问码无效或已过期';
            submitBtn.disabled = false;
            submitBtn.textContent = '访问文档';
            codeInput.focus();
          }
        })
        .catch(error => {
          console.error('认证出错:', error);
          messageEl.textContent = '认证服务出错，请稍后重试';
          submitBtn.disabled = false;
          submitBtn.textContent = '访问文档';
        });
    }

    // 绑定事件
    submitBtn.addEventListener('click', handleSubmit);
    codeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    });
  }

  // 验证访问码
  async function validateCode(code) {
    log('验证访问码:', code);

    // 本地验证码列表
    const validCodes = [
      '8FpbQktwX00v4ibfx4Ta', // 到2024-12-31
      'XANFp5VBeNfmhkxo7EWr', // 到2024-06-30
      'Q0ebZra96sYUnqngAug1'  // 到2024-06-30
    ];

    // 首先尝试本地验证
    if (validCodes.includes(code)) {
      log('本地验证成功');

      // 设置7天的过期时间
      const expireAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

      localStorage.setItem('flatland-auth', JSON.stringify({
        expireAt: expireAt,
        timestamp: Date.now(),
        localAuth: true
      }));

      return true;
    }

    // 如果本地验证失败，尝试远程验证
    log('本地验证失败，尝试远程验证');

    try {
      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // 发送认证请求
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ code }),
        signal: controller.signal,
        mode: 'cors'
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

          return true;
        }
      }

      return false;
    } catch (error) {
      log('远程验证失败:', error);

      // 如果是网络错误，给用户一个机会
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // 提示用户网络错误，但仍然允许访问
        alert('无法连接到认证服务器，将允许临时访问。请确保您有权访问此内容。');

        // 设置短期的临时访问权限（1小时）
        const expireAt = Date.now() + 1 * 60 * 60 * 1000;

        localStorage.setItem('flatland-auth', JSON.stringify({
          expireAt: expireAt,
          timestamp: Date.now(),
          temporary: true
        }));

        return true;
      }

      return false;
    }
  }

  // 继续加载页面
  function continueLoading() {
    log('认证成功，继续加载页面');
    // 不需要做任何事情，页面会继续加载
  }

  // 清除认证数据
  function clearAuth() {
    log('清除认证数据');
    localStorage.removeItem('flatland-auth');
    localStorage.removeItem('flatworld-auth');
    location.reload();
  }

  // 暴露全局函数
  window.clearFlatlandAuth = clearAuth;

  // 主函数 - 在页面加载时执行
  function main() {
    log('预认证脚本开始执行');

    // 检查认证状态
    if (!isAuthenticated()) {
      log('用户未认证，显示认证页面');

      // 等待DOM加载完成
      if (document.readyState === 'loading') {
        // 先隐藏页面内容，防止闪烁
        document.write('<style>body{visibility:hidden;}</style>');
        document.addEventListener('DOMContentLoaded', function() {
          authenticate();
        });
      } else {
        authenticate();
      }
    } else {
      log('用户已认证，继续加载页面');
      continueLoading();
    }
  }

  // 执行主函数
  main();
})();
