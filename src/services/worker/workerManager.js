class WorkerManager {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.messageHandlers = new Map();
    this.nextMessageId = 1;
    this.pendingTimeouts = new Set(); // 追踪所有待清理的定时器
  }

  async init() {
    if (this.worker) {
      return this.isReady;
    }

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/worker.js');

        this.worker.onmessage = (e) => {
          this.handleMessage(e.data);
        };

        this.worker.onerror = (error) => {
          console.error('Worker error:', error);
          this.isReady = false;
          reject(error);
        };

        // 测试连接
        this.sendMessage('PING')
          .then(() => {
            this.isReady = true;
            resolve(true);
          })
          .catch(reject);

      } catch (error) {
        console.error('Failed to create worker:', error);
        reject(error);
      }
    });
  }

  handleMessage(message) {
    const { type, payload, messageId } = message;

    if (messageId && this.messageHandlers.has(messageId)) {
      const handler = this.messageHandlers.get(messageId);
      this.messageHandlers.delete(messageId);
      handler(message);
      return;
    }

    // 处理广播消息
    this.emit(type, payload);
  }

  sendMessage(type, payload) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const messageId = this.nextMessageId++;
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        this.pendingTimeouts.delete(timeout);
        reject(new Error('Message timeout'));
      }, 30000);
      
      // 追踪定时器以便清理
      this.pendingTimeouts.add(timeout);

      this.messageHandlers.set(messageId, (response) => {
        clearTimeout(timeout);
        this.pendingTimeouts.delete(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });

      this.worker.postMessage({
        type,
        payload,
        messageId
      });
    });
  }

  postMessage(type, payload) {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    this.worker.postMessage({
      type,
      payload
    });
  }

  emit(type, payload) {
    // 简单的事件发射器
    if (this.eventHandlers && this.eventHandlers[type]) {
      this.eventHandlers[type].forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  on(type, handler) {
    if (!this.eventHandlers) {
      this.eventHandlers = {};
    }
    if (!this.eventHandlers[type]) {
      this.eventHandlers[type] = [];
    }
    this.eventHandlers[type].push(handler);
  }

  off(type, handler) {
    if (this.eventHandlers && this.eventHandlers[type]) {
      const index = this.eventHandlers[type].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[type].splice(index, 1);
      }
    }
  }

  terminate() {
    // 清理所有待处理的定时器
    this.pendingTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.pendingTimeouts.clear();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.messageHandlers.clear();
      this.eventHandlers = {};
    }
  }
}

export default new WorkerManager();
