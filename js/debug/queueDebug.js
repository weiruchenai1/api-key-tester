// 最小化并发队列调试脚本（可在浏览器控制台或本地引入后运行）
(function(){
  if (!window.processWithFixedConcurrency) {
    console.warn('[queueDebug] 需要先加载 js/core/concurrency.js');
    return;
  }
  window.currentConcurrency = 2;
  window.currentRetryCount = 0;
  window.shouldCancelTesting = false;
  window.completedCount = 0;
  const keys = Array.from({length: 8}, (_,i)=>'dbg-'+(i+1));
  window.totalCount = keys.length;

  // 注入最小 UI 节点
  if (!document.getElementById('progressFill')) {
    const fill = document.createElement('div');
    fill.id = 'progressFill';
    document.body.appendChild(fill);
  }

  // 模拟 API 测试：随机延迟 100~400ms 后成功
  window.testApiKeyWithRetry = async (apiKey) => {
    console.debug('[queueDebug:start]', apiKey);
    await new Promise(r => setTimeout(r, 100 + Math.random()*300));
    console.debug('[queueDebug:done]', apiKey);
    return { valid: true, error: null, isRateLimit: false };
  };

  window.updateUIAsync = () => {};
  window.updateProgress = window.updateProgress || function(){
    const progress = (completedCount / totalCount) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
  };

  console.info('[queueDebug] 开始并发调试，keys:', keys);
  window.processWithFixedConcurrency(keys, 'gemini').then(()=>{
    console.info('[queueDebug] 完成');
  });
})();


