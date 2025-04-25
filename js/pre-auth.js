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
    
    // 创建认证对话框
    const authDialog = document.createElement('div');
    authDialog.className = 'auth-dialog';
    authDialog.innerHTML = `
      <div class="auth-dialog-content">
        <h2>访问受限</h2>
        <p>请输入访问码以继续访问文档</p>
        <input type="text" id="auth-code-input" placeholder="请输入访问码" />
        <div class="auth-dialog-buttons">
          <button id="auth-submit-btn">提交</button>
          <button id="auth-cancel-btn">取消</button>
        </div>
        <div id="auth-message"></div>
      </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .auth-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      .auth-dialog-content {
        background-color: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 400px;
        text-align: center;
      }
      .auth-dialog-content h2 {
        margin-top: 0;
        color: #333;
      }
      .auth-dialog-content input {
        width: 100%;
        padding: 10px;
        margin: 15px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .auth-dialog-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
      }
      .auth-dialog-buttons button {
        padding: 8px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      #auth-submit-btn {
        background-color: #42b983;
        color: white;
      }
      #auth-submit-btn:hover {
        background-color: #3aa776;
      }
      #auth-cancel-btn {
        background-color: #f5f5f5;
        color: #333;
      }
      #auth-cancel-btn:hover {
        background-color: #e8e8e8;
      }
      #auth-message {
        margin-top: 15px;
        color: #e74c3c;
        min-height: 20px;
      }
    `;
    
    // 添加到页面
    document.body.appendChild(style);
    document.body.appendChild(authDialog);
    
    // 获取元素
    const codeInput = document.getElementById('auth-code-input');
    const submitBtn = document.getElementById('auth-submit-btn');
    const cancelBtn = document.getElementById('auth-cancel-btn');
    const messageEl = document.getElementById('auth-message');
    
    // 设置焦点
    setTimeout(() => codeInput.focus(), 100);
    
    // 处理提交
    function handleSubmit() {
      const code = codeInput.value.trim();
      
      if (!code) {
        messageEl.textContent = '请输入访问码';
        return;
      }
      
      messageEl.textContent = '正在验证...';
      submitBtn.disabled = true;
      
      // 验证访问码
      validateCode(code)
        .then(valid => {
          if (valid) {
            // 认证成功，移除对话框并继续加载页面
            document.body.removeChild(authDialog);
            continueLoading();
          } else {
            messageEl.textContent = '访问码无效或已过期';
            submitBtn.disabled = false;
          }
        })
        .catch(error => {
          console.error('认证出错:', error);
          messageEl.textContent = '认证服务出错，请稍后重试';
          submitBtn.disabled = false;
        });
    }
    
    // 处理取消
    function handleCancel() {
      // 显示访问受限页面
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px 20px;">
          <h1>访问受限</h1>
          <p>您需要有效的访问码才能查看此内容。</p>
          <button onclick="location.reload()" style="
            padding: 10px 20px;
            background-color: #42b983;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
          ">重新尝试</button>
        </div>
      `;
    }
    
    // 绑定事件
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
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
      log('用户未认证，显示认证对话框');
      
      // 隐藏页面内容，直到认证完成
      document.documentElement.style.visibility = 'hidden';
      
      // 等待DOM加载完成
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', authenticate);
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
