export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  start(name) {
    this.startTimes.set(name, performance.now());
  }

  end(name) {
    const startTime = this.startTimes.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.set(name, duration);
      this.startTimes.delete(name);
      return duration;
    }
    return 0;
  }

  get(name) {
    return this.metrics.get(name) || 0;
  }

  getAll() {
    return Object.fromEntries(this.metrics);
  }

  clear() {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const batchUpdate = (updates, batchSize = 50) => {
  return new Promise((resolve) => {
    let index = 0;

    const processBatch = () => {
      const end = Math.min(index + batchSize, updates.length);

      for (let i = index; i < end; i++) {
        updates[i]();
      }

      index = end;

      if (index < updates.length) {
        requestAnimationFrame(processBatch);
      } else {
        resolve();
      }
    };

    processBatch();
  });
};

export const measureRenderTime = (componentName, renderFunction) => {
  return (...args) => {
    performanceMonitor.start(`render_${componentName}`);
    const result = renderFunction(...args);
    performanceMonitor.end(`render_${componentName}`);
    return result;
  };
};

export const optimizeListRendering = {
  // 虚拟化相关的性能优化
  calculateVisibleItems: (scrollTop, containerHeight, itemHeight, totalItems) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems - 1
    );

    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleCount: endIndex - startIndex + 1
    };
  },

  // 预加载缓冲区
  addBuffer: (startIndex, endIndex, totalItems, bufferSize = 5) => {
    return {
      startIndex: Math.max(0, startIndex - bufferSize),
      endIndex: Math.min(totalItems - 1, endIndex + bufferSize)
    };
  }
};

export const memoryOptimization = {
  // 清理不再使用的对象引用
  cleanup: (objectsToClean) => {
    objectsToClean.forEach(obj => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          delete obj[key];
        });
      }
    });
  },

  // 监控内存使用情况
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};
