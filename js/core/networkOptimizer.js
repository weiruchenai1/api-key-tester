/**
 * 网络优化器 - 连接复用和请求合并
 * 提供高效的网络请求管理，减少延迟和提高吞吐量
 */

class NetworkOptimizer {
    constructor() {
        this.config = {
            maxConnectionsPerHost: 6,     // 每个主机最大连接数
            connectionTimeout: 10000,     // 连接超时10秒
            requestTimeout: 5000,         // 请求超时5秒
            keepAliveTimeout: 30000,      // Keep-Alive超时30秒
            enableRequestMerging: true,   // 启用请求合并
            mergingWindow: 100,           // 合并窗口100ms
            enableConnectionReuse: true,  // 启用连接复用
            maxRetries: 2,                // 网络层重试次数
            compressionEnabled: true      // 启用压缩
        };
        
        // 连接池管理
        this.connectionPool = new Map(); // host -> connections[]
        this.activeRequests = new Map(); // requestId -> request info
        this.requestQueue = new Map();   // host -> pending requests[]
        
        // 请求合并
        this.mergingQueue = new Map();   // endpoint -> pending requests[]
        this.mergingTimers = new Map();  // endpoint -> timer
        
        // 性能统计
        this.stats = {
            totalRequests: 0,
            mergedRequests: 0,
            reusedConnections: 0,
            connectionPoolHits: 0,
            avgResponseTime: 0,
            networkErrors: 0,
            timeoutErrors: 0
        };
        
        // 启动清理任务
        this.startCleanupTasks();
        
        console.log('[NetworkOptimizer] 网络优化器已启动');
    }
    
    /**
     * 初始化网络优化器
     */
    async initialize() {
        // 清理现有连接和队列
        this.connectionPool.clear();
        this.activeRequests.clear();
        this.requestQueue.clear();
        this.mergingQueue.clear();
        
        // 清理定时器
        this.mergingTimers.forEach(timer => clearTimeout(timer));
        this.mergingTimers.clear();
        
        // 重置统计
        this.stats = {
            totalRequests: 0,
            mergedRequests: 0,
            reusedConnections: 0,
            connectionPoolHits: 0,
            avgResponseTime: 0,
            networkErrors: 0,
            timeoutErrors: 0
        };
        
        // 重新启动清理任务
        this.startCleanupTasks();
        
        console.log('[NetworkOptimizer] 初始化完成');
    }

    /**
     * 优化的fetch请求
     */
    async optimizedFetch(url, options = {}) {
        const requestId = this.generateRequestId();
        const host = new URL(url).host;
        const startTime = Date.now();
        
        this.stats.totalRequests++;
        
        try {
            // 检查是否可以合并请求
            if (this.config.enableRequestMerging && this.canMergeRequest(url, options)) {
                return await this.handleMergedRequest(url, options, requestId);
            }
            
            // 获取或创建连接
            const connection = await this.acquireConnection(host);
            
            // 执行请求
            const response = await this.executeRequest(url, options, connection, requestId);
            
            // 记录性能指标
            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, true);
            
            // 释放连接（复用）
            this.releaseConnection(host, connection);
            
            return response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, false, error);
            
            // 清理失败的请求
            this.activeRequests.delete(requestId);
            
            throw error;
        }
    }
    
    /**
     * 获取连接
     */
    async acquireConnection(host) {
        if (!this.connectionPool.has(host)) {
            this.connectionPool.set(host, []);
        }
        
        const connections = this.connectionPool.get(host);
        
        // 查找可用连接
        const availableConnection = connections.find(conn => 
            !conn.busy && this.isConnectionAlive(conn)
        );
        
        if (availableConnection) {
            availableConnection.busy = true;
            availableConnection.lastUsed = Date.now();
            this.stats.connectionPoolHits++;
            return availableConnection;
        }
        
        // 检查连接数限制
        if (connections.length >= this.config.maxConnectionsPerHost) {
            // 等待连接可用
            return await this.waitForConnection(host);
        }
        
        // 创建新连接
        return this.createConnection(host);
    }
    
    /**
     * 创建新连接
     */
    createConnection(host) {
        const connection = {
            id: this.generateConnectionId(),
            host,
            busy: true,
            created: Date.now(),
            lastUsed: Date.now(),
            requestCount: 0,
            alive: true
        };
        
        this.connectionPool.get(host).push(connection);
        
        console.log(`[NetworkOptimizer] 创建新连接: ${connection.id} for ${host}`);
        return connection;
    }
    
    /**
     * 等待连接可用
     */
    async waitForConnection(host) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection pool timeout'));
            }, this.config.connectionTimeout);
            
            const checkConnection = () => {
                const connections = this.connectionPool.get(host) || [];
                const available = connections.find(conn => 
                    !conn.busy && this.isConnectionAlive(conn)
                );
                
                if (available) {
                    clearTimeout(timeout);
                    available.busy = true;
                    available.lastUsed = Date.now();
                    resolve(available);
                } else {
                    setTimeout(checkConnection, 10);
                }
            };
            
            checkConnection();
        });
    }
    
    /**
     * 释放连接
     */
    releaseConnection(host, connection) {
        if (!connection) return;
        
        connection.busy = false;
        connection.lastUsed = Date.now();
        connection.requestCount++;
        
        this.stats.reusedConnections++;
        
        // 检查连接是否应该关闭
        if (connection.requestCount > 100 || 
            Date.now() - connection.created > this.config.keepAliveTimeout) {
            this.closeConnection(host, connection);
        }
    }
    
    /**
     * 关闭连接
     */
    closeConnection(host, connection) {
        const connections = this.connectionPool.get(host) || [];
        const index = connections.findIndex(conn => conn.id === connection.id);
        
        if (index !== -1) {
            connections.splice(index, 1);
            connection.alive = false;
            console.log(`[NetworkOptimizer] 关闭连接: ${connection.id}`);
        }
    }
    
    /**
     * 检查连接是否存活
     */
    isConnectionAlive(connection) {
        const now = Date.now();
        return connection.alive && 
               (now - connection.lastUsed) < this.config.keepAliveTimeout;
    }
    
    /**
     * 执行请求
     */
    async executeRequest(url, options, connection, requestId) {
        // 记录活跃请求
        this.activeRequests.set(requestId, {
            url,
            options,
            connection,
            startTime: Date.now()
        });
        
        // 设置优化的请求选项
        const optimizedOptions = this.optimizeRequestOptions(options);
        
        // 执行请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.config.requestTimeout);
        
        try {
            const response = await fetch(url, {
                ...optimizedOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
            
            if (error.name === 'AbortError') {
                this.stats.timeoutErrors++;
                throw new Error('Request timeout');
            }
            
            this.stats.networkErrors++;
            throw error;
        }
    }
    
    /**
     * 优化请求选项
     */
    optimizeRequestOptions(options) {
        const optimized = { ...options };
        
        // 设置Keep-Alive
        if (this.config.enableConnectionReuse) {
            optimized.headers = {
                'Connection': 'keep-alive',
                'Keep-Alive': `timeout=${this.config.keepAliveTimeout / 1000}`,
                ...optimized.headers
            };
        }
        
        // 启用压缩
        if (this.config.compressionEnabled) {
            optimized.headers = {
                'Accept-Encoding': 'gzip, deflate, br',
                ...optimized.headers
            };
        }
        
        // 设置缓存策略
        if (!optimized.cache) {
            optimized.cache = 'no-cache';
        }
        
        return optimized;
    }
    
    /**
     * 检查是否可以合并请求
     */
    canMergeRequest(url, options) {
        // 只合并GET请求
        if (options.method && options.method.toUpperCase() !== 'GET') {
            return false;
        }
        
        // 检查URL是否适合合并
        const urlObj = new URL(url);
        const endpoint = `${urlObj.origin}${urlObj.pathname}`;
        
        return this.mergingQueue.has(endpoint);
    }
    
    /**
     * 处理合并请求
     */
    async handleMergedRequest(url, options, requestId) {
        const urlObj = new URL(url);
        const endpoint = `${urlObj.origin}${urlObj.pathname}`;
        
        return new Promise((resolve, reject) => {
            // 添加到合并队列
            if (!this.mergingQueue.has(endpoint)) {
                this.mergingQueue.set(endpoint, []);
            }
            
            this.mergingQueue.get(endpoint).push({
                url,
                options,
                requestId,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            // 设置合并定时器
            if (!this.mergingTimers.has(endpoint)) {
                this.mergingTimers.set(endpoint, setTimeout(() => {
                    this.executeMergedRequests(endpoint);
                }, this.config.mergingWindow));
            }
        });
    }
    
    /**
     * 执行合并的请求
     */
    async executeMergedRequests(endpoint) {
        const requests = this.mergingQueue.get(endpoint) || [];
        if (requests.length === 0) return;
        
        this.mergingQueue.delete(endpoint);
        this.mergingTimers.delete(endpoint);
        
        console.log(`[NetworkOptimizer] 执行合并请求: ${requests.length} 个请求 -> ${endpoint}`);
        
        // 选择代表性请求
        const primaryRequest = requests[0];
        
        try {
            // 执行单个请求代表所有请求
            const response = await this.optimizedFetch(primaryRequest.url, primaryRequest.options);
            
            // 克隆响应给所有请求
            const responseClones = await this.cloneResponse(response, requests.length);
            
            // 解析所有请求
            requests.forEach((request, index) => {
                request.resolve(responseClones[index]);
            });
            
            this.stats.mergedRequests += requests.length - 1;
            
        } catch (error) {
            // 所有请求都失败
            requests.forEach(request => {
                request.reject(error);
            });
        }
    }
    
    /**
     * 克隆响应
     */
    async cloneResponse(response, count) {
        const clones = [];
        
        // 读取响应体
        const responseText = await response.text();
        
        // 创建多个响应克隆
        for (let i = 0; i < count; i++) {
            clones.push(new Response(responseText, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            }));
        }
        
        return clones;
    }
    
    /**
     * 启动清理任务
     */
    startCleanupTasks() {
        // 定期清理过期连接
        this.connectionCleanupTimer = setInterval(() => {
            try {
                this.cleanupExpiredConnections();
            } catch (error) {
                console.error('[NetworkOptimizer] 连接清理出错:', error);
            }
        }, 60000); // 每分钟清理一次
        
        // 定期清理过期的合并请求
        this.mergeCleanupTimer = setInterval(() => {
            try {
                this.cleanupExpiredMergeRequests();
            } catch (error) {
                console.error('[NetworkOptimizer] 合并请求清理出错:', error);
            }
        }, 10000); // 每10秒清理一次
    }
    
    /**
     * 清理过期连接
     */
    cleanupExpiredConnections() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [host, connections] of this.connectionPool.entries()) {
            const validConnections = connections.filter(conn => {
                const isExpired = (now - conn.lastUsed) > this.config.keepAliveTimeout;
                const shouldClean = isExpired || !conn.alive;
                
                if (shouldClean) {
                    cleanedCount++;
                }
                
                return !shouldClean;
            });
            
            this.connectionPool.set(host, validConnections);
        }
        
        if (cleanedCount > 0) {
            console.log(`[NetworkOptimizer] 清理过期连接: ${cleanedCount} 个`);
        }
    }
    
    /**
     * 清理过期的合并请求
     */
    cleanupExpiredMergeRequests() {
        const now = Date.now();
        const expireThreshold = this.config.mergingWindow * 10; // 10倍合并窗口
        
        for (const [endpoint, requests] of this.mergingQueue.entries()) {
            const expiredRequests = requests.filter(req => 
                (now - req.timestamp) > expireThreshold
            );
            
            if (expiredRequests.length > 0) {
                // 拒绝过期请求
                expiredRequests.forEach(req => {
                    req.reject(new Error('Merge request expired'));
                });
                
                // 移除过期请求
                const validRequests = requests.filter(req => 
                    (now - req.timestamp) <= expireThreshold
                );
                
                if (validRequests.length > 0) {
                    this.mergingQueue.set(endpoint, validRequests);
                } else {
                    this.mergingQueue.delete(endpoint);
                    if (this.mergingTimers.has(endpoint)) {
                        clearTimeout(this.mergingTimers.get(endpoint));
                        this.mergingTimers.delete(endpoint);
                    }
                }
                
                console.log(`[NetworkOptimizer] 清理过期合并请求: ${expiredRequests.length} 个`);
            }
        }
    }
    
    /**
     * 更新统计信息
     */
    updateStats(responseTime, success, error = null) {
        // 更新平均响应时间
        const totalTime = this.stats.avgResponseTime * (this.stats.totalRequests - 1) + responseTime;
        this.stats.avgResponseTime = totalTime / this.stats.totalRequests;
        
        if (!success) {
            if (error && error.message.includes('timeout')) {
                this.stats.timeoutErrors++;
            } else {
                this.stats.networkErrors++;
            }
        }
    }
    
    /**
     * 生成请求ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * 生成连接ID
     */
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    /**
     * 获取详细统计信息
     */
    getDetailedStats() {
        const connectionStats = {};
        let totalConnections = 0;
        let busyConnections = 0;
        
        for (const [host, connections] of this.connectionPool.entries()) {
            connectionStats[host] = {
                total: connections.length,
                busy: connections.filter(conn => conn.busy).length,
                idle: connections.filter(conn => !conn.busy && this.isConnectionAlive(conn)).length
            };
            totalConnections += connections.length;
            busyConnections += connectionStats[host].busy;
        }
        
        return {
            requests: {
                total: this.stats.totalRequests,
                merged: this.stats.mergedRequests,
                mergeRatio: this.stats.totalRequests > 0 ? 
                    (this.stats.mergedRequests / this.stats.totalRequests * 100).toFixed(1) + '%' : '0%'
            },
            connections: {
                total: totalConnections,
                busy: busyConnections,
                idle: totalConnections - busyConnections,
                poolHits: this.stats.connectionPoolHits,
                reused: this.stats.reusedConnections
            },
            performance: {
                avgResponseTime: this.stats.avgResponseTime.toFixed(0) + 'ms',
                networkErrors: this.stats.networkErrors,
                timeoutErrors: this.stats.timeoutErrors,
                errorRate: this.stats.totalRequests > 0 ? 
                    ((this.stats.networkErrors + this.stats.timeoutErrors) / this.stats.totalRequests * 100).toFixed(1) + '%' : '0%'
            },
            queues: {
                activeRequests: this.activeRequests.size,
                pendingMerges: Array.from(this.mergingQueue.values()).reduce((sum, arr) => sum + arr.length, 0)
            }
        };
    }
    
    /**
     * 重置统计数据
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            mergedRequests: 0,
            reusedConnections: 0,
            connectionPoolHits: 0,
            avgResponseTime: 0,
            networkErrors: 0,
            timeoutErrors: 0
        };
        
        console.log('[NetworkOptimizer] 统计数据已重置');
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[NetworkOptimizer] 配置已更新:', newConfig);
    }
    
    /**
     * 清理所有资源
     */
    cleanup() {
        // 清理定时器
        if (this.connectionCleanupTimer) {
            clearInterval(this.connectionCleanupTimer);
            this.connectionCleanupTimer = null;
        }
        
        if (this.mergeCleanupTimer) {
            clearInterval(this.mergeCleanupTimer);
            this.mergeCleanupTimer = null;
        }
        
        for (const timer of this.mergingTimers.values()) {
            clearTimeout(timer);
        }
        this.mergingTimers.clear();
        
        // 清理队列
        this.mergingQueue.clear();
        this.activeRequests.clear();
        this.requestQueue.clear();
        
        // 清理连接池
        this.connectionPool.clear();
        
        console.log('[NetworkOptimizer] 资源已清理');
    }
}

// 创建全局实例
const networkOptimizer = new NetworkOptimizer();

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.networkOptimizer = networkOptimizer;
    
    // 替换全局fetch
    window.originalFetch = window.fetch;
    window.optimizedFetch = networkOptimizer.optimizedFetch.bind(networkOptimizer);
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        networkOptimizer.cleanup();
    });
}

export default networkOptimizer;
