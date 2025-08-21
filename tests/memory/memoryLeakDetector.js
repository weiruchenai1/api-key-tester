/**
 * 内存泄漏检测工具
 * 用于监控和检测API密钥测试工具的内存使用情况
 */

class MemoryLeakDetector {
    constructor() {
        this.config = {
            samplingInterval: 1000,        // 采样间隔1秒
            maxSamples: 300,              // 最多保存300个样本(5分钟)
            leakThreshold: 0.1,           // 泄漏阈值10%
            growthThreshold: 50 * 1024 * 1024, // 增长阈值50MB
            stabilityWindow: 30,          // 稳定性窗口30秒
            alertThreshold: 100 * 1024 * 1024 // 警告阈值100MB
        };
        
        this.samples = [];
        this.isMonitoring = false;
        this.monitoringTimer = null;
        this.listeners = [];
        this.baseline = null;
        
        // 检测结果
        this.detectionResults = {
            hasLeak: false,
            leakRate: 0,
            suspiciousObjects: [],
            recommendations: []
        };
        
        console.log('[MemoryLeakDetector] 内存泄漏检测器已初始化');
    }
    
    /**
     * 开始监控内存使用
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('[MemoryLeakDetector] 已在监控中');
            return;
        }
        
        this.isMonitoring = true;
        this.samples = [];
        this.baseline = this.getCurrentMemoryUsage();
        
        this.monitoringTimer = setInterval(() => {
            this.collectSample();
        }, this.config.samplingInterval);
        
        console.log('[MemoryLeakDetector] 开始内存监控');
        this.notifyListeners('monitoring_started', { baseline: this.baseline });
    }
    
    /**
     * 停止监控
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        
        this.isMonitoring = false;
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        // 分析结果
        const analysis = this.analyzeMemoryUsage();
        
        console.log('[MemoryLeakDetector] 停止内存监控');
        this.notifyListeners('monitoring_stopped', analysis);
        
        return analysis;
    }
    
    /**
     * 收集内存样本
     */
    collectSample() {
        const sample = {
            timestamp: Date.now(),
            memory: this.getCurrentMemoryUsage(),
            gcInfo: this.getGCInfo(),
            domNodes: this.getDOMNodeCount(),
            eventListeners: this.getEventListenerCount()
        };
        
        this.samples.push(sample);
        
        // 保持样本数量在限制内
        if (this.samples.length > this.config.maxSamples) {
            this.samples.shift();
        }
        
        // 实时检测异常
        this.checkForAnomalies(sample);
        
        this.notifyListeners('sample_collected', sample);
    }
    
    /**
     * 获取当前内存使用情况
     */
    getCurrentMemoryUsage() {
        const memInfo = {
            used: 0,
            total: 0,
            limit: 0,
            available: 0
        };
        
        if (typeof performance !== 'undefined' && performance.memory) {
            memInfo.used = performance.memory.usedJSHeapSize;
            memInfo.total = performance.memory.totalJSHeapSize;
            memInfo.limit = performance.memory.jsHeapSizeLimit;
            memInfo.available = memInfo.limit - memInfo.used;
        }
        
        return memInfo;
    }
    
    /**
     * 获取垃圾回收信息
     */
    getGCInfo() {
        // 模拟GC信息，实际环境中可能需要其他方法
        return {
            collections: 0,
            duration: 0,
            reclaimed: 0
        };
    }
    
    /**
     * 获取DOM节点数量
     */
    getDOMNodeCount() {
        if (typeof document !== 'undefined') {
            return document.getElementsByTagName('*').length;
        }
        return 0;
    }
    
    /**
     * 获取事件监听器数量（估算）
     */
    getEventListenerCount() {
        // 这是一个估算，实际实现可能需要更复杂的逻辑
        let count = 0;
        if (typeof window !== 'undefined' && window.getEventListeners) {
            // Chrome DevTools API
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                const listeners = window.getEventListeners(el);
                Object.keys(listeners).forEach(type => {
                    count += listeners[type].length;
                });
            });
        }
        return count;
    }
    
    /**
     * 检测异常情况
     */
    checkForAnomalies(sample) {
        if (this.samples.length < 10) return; // 需要足够的样本
        
        const recentSamples = this.samples.slice(-10);
        const memoryGrowth = sample.memory.used - recentSamples[0].memory.used;
        
        // 检测内存快速增长
        if (memoryGrowth > this.config.growthThreshold) {
            this.notifyListeners('anomaly_detected', {
                type: 'rapid_growth',
                growth: memoryGrowth,
                sample: sample
            });
        }
        
        // 检测内存使用过高
        if (sample.memory.used > this.config.alertThreshold) {
            this.notifyListeners('anomaly_detected', {
                type: 'high_usage',
                usage: sample.memory.used,
                sample: sample
            });
        }
    }
    
    /**
     * 分析内存使用模式
     */
    analyzeMemoryUsage() {
        if (this.samples.length < 2) {
            return {
                hasLeak: false,
                message: '样本数据不足，无法分析'
            };
        }
        
        const analysis = {
            duration: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
            totalSamples: this.samples.length,
            memoryStats: this.calculateMemoryStats(),
            leakDetection: this.detectMemoryLeak(),
            recommendations: []
        };
        
        // 生成建议
        analysis.recommendations = this.generateRecommendations(analysis);
        
        return analysis;
    }
    
    /**
     * 计算内存统计信息
     */
    calculateMemoryStats() {
        const memoryValues = this.samples.map(s => s.memory.used);
        const domCounts = this.samples.map(s => s.domNodes);
        
        return {
            memory: {
                min: Math.min(...memoryValues),
                max: Math.max(...memoryValues),
                avg: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
                growth: memoryValues[memoryValues.length - 1] - memoryValues[0],
                trend: this.calculateTrend(memoryValues)
            },
            domNodes: {
                min: Math.min(...domCounts),
                max: Math.max(...domCounts),
                avg: domCounts.reduce((a, b) => a + b, 0) / domCounts.length,
                growth: domCounts[domCounts.length - 1] - domCounts[0]
            }
        };
    }
    
    /**
     * 检测内存泄漏
     */
    detectMemoryLeak() {
        const memoryValues = this.samples.map(s => s.memory.used);
        const trend = this.calculateTrend(memoryValues);
        const growth = memoryValues[memoryValues.length - 1] - memoryValues[0];
        const duration = this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp;
        
        // 计算泄漏率 (MB/分钟)
        const leakRate = (growth / (1024 * 1024)) / (duration / 60000);
        
        const hasLeak = trend > this.config.leakThreshold && leakRate > 1;
        
        return {
            hasLeak,
            leakRate,
            trend,
            growth,
            confidence: this.calculateLeakConfidence(trend, leakRate, memoryValues)
        };
    }
    
    /**
     * 计算趋势
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }
    
    /**
     * 计算泄漏置信度
     */
    calculateLeakConfidence(trend, leakRate, values) {
        let confidence = 0;
        
        // 基于趋势的置信度
        if (trend > 0.5) confidence += 0.4;
        else if (trend > 0.2) confidence += 0.2;
        
        // 基于泄漏率的置信度
        if (leakRate > 5) confidence += 0.4;
        else if (leakRate > 2) confidence += 0.2;
        
        // 基于稳定性的置信度
        const stability = this.calculateStability(values);
        if (stability < 0.1) confidence += 0.2;
        
        return Math.min(confidence, 1.0);
    }
    
    /**
     * 计算稳定性
     */
    calculateStability(values) {
        if (values.length < 2) return 1;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev / mean; // 变异系数
    }
    
    /**
     * 生成建议
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.leakDetection.hasLeak) {
            recommendations.push({
                type: 'critical',
                message: '检测到内存泄漏',
                details: `泄漏率: ${analysis.leakDetection.leakRate.toFixed(2)} MB/分钟`,
                actions: [
                    '检查事件监听��是否正确移除',
                    '检查定时器是否正确清理',
                    '检查闭包引用是否存在循环引用',
                    '使用浏览器开发工具进行详细分析'
                ]
            });
        }
        
        if (analysis.memoryStats.memory.growth > 50 * 1024 * 1024) {
            recommendations.push({
                type: 'warning',
                message: '内存使用增长较大',
                details: `增长: ${(analysis.memoryStats.memory.growth / 1024 / 1024).toFixed(2)} MB`,
                actions: [
                    '检查是否有大量数据缓存',
                    '考虑实现数据分页或清理机制',
                    '优化数据结构和算法'
                ]
            });
        }
        
        if (analysis.memoryStats.domNodes.growth > 1000) {
            recommendations.push({
                type: 'warning',
                message: 'DOM节点数量增长过多',
                details: `增长: ${analysis.memoryStats.domNodes.growth} 个节点`,
                actions: [
                    '检查动态创建的DOM元素是否正确移除',
                    '使用虚拟滚动或分页减少DOM节点',
                    '清理不需要的DOM元素'
                ]
            });
        }
        
        return recommendations;
    }
    
    /**
     * 添加监听器
     */
    addListener(listener) {
        this.listeners.push(listener);
    }
    
    /**
     * 移除监听器
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    /**
     * 通知监听器
     */
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('[MemoryLeakDetector] 监听器错误:', error);
            }
        });
    }
    
    /**
     * 生成报告
     */
    generateReport() {
        const analysis = this.analyzeMemoryUsage();
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                isMonitoring: this.isMonitoring,
                duration: analysis.duration,
                samplesCount: analysis.totalSamples,
                hasLeak: analysis.leakDetection?.hasLeak || false,
                leakRate: analysis.leakDetection?.leakRate || 0
            },
            details: analysis,
            samples: this.samples.slice(-50) // 最近50个样本
        };
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        this.stopMonitoring();
        this.samples = [];
        this.listeners = [];
        console.log('[MemoryLeakDetector] 资源已清理');
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.MemoryLeakDetector = MemoryLeakDetector;
}

// 兼容不同的模块系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryLeakDetector;
}

// ES6 模块导出
if (typeof exports !== 'undefined') {
    exports.default = MemoryLeakDetector;
}
