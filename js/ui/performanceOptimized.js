// 高性能版本的结果更新模块
// 使用虚拟列表、缓存统计、批量更新等优化策略

let virtualLists = {};
let cachedStats = null;
let statsDirty = true;
let lastUpdateTime = 0;
const UPDATE_THROTTLE = 100; // 增加节流时间到100ms
const LARGE_DATA_THRESHOLD = 1000; // 超过1000个密钥时启用性能优化

// 缓存过滤结果，避免重复计算
const filterCache = new Map();
let cacheVersion = 0;

function invalidateCache() {
    filterCache.clear();
    cacheVersion++;
    statsDirty = true;
}

function getFilteredKeys(filterName) {
    const cacheKey = `${filterName}_${cacheVersion}`;
    if (filterCache.has(cacheKey)) {
        return filterCache.get(cacheKey);
    }
    
    let result;
    switch (filterName) {
        case 'valid':
            result = allKeysData.filter(k => k.status === 'valid');
            break;
        case 'invalid':
            result = allKeysData.filter(k => k.status === 'invalid');
            break;
        case 'rate-limited':
            result = allKeysData.filter(k => k.status === 'rate-limited');
            break;
        case 'paid':
            result = allKeysData.filter(k => k.status === 'paid');
            break;
        case 'testing':
            result = allKeysData.filter(k => k.status === 'testing');
            break;
        case 'retrying':
            result = allKeysData.filter(k => k.status === 'retrying');
            break;
        case 'pending':
            result = allKeysData.filter(k => k.status === 'pending');
            break;
        default:
            result = allKeysData;
    }
    
    filterCache.set(cacheKey, result);
    return result;
}

function updateStatsOptimized() {
    if (!statsDirty) return;
    
    // 只计算一次统计数据
    const stats = {
        total: allKeysData.length,
        valid: 0,
        invalid: 0,
        rateLimited: 0,
        paid: 0,
        testing: 0,
        retrying: 0,
        pending: 0
    };
    
    // 单次遍历计算所有统计
    for (const key of allKeysData) {
        switch (key.status) {
            case 'valid': stats.valid++; break;
            case 'invalid': stats.invalid++; break;
            case 'rate-limited': stats.rateLimited++; break;
            case 'paid': stats.paid++; break;
            case 'testing': stats.testing++; break;
            case 'retrying': stats.retrying++; break;
            case 'pending': stats.pending++; break;
        }
    }
    
    // 更新DOM
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('validCount').textContent = stats.valid;
    document.getElementById('invalidCount').textContent = stats.invalid;
    document.getElementById('rateLimitedCount').textContent = stats.rateLimited;
    document.getElementById('testingCount').textContent = stats.testing + stats.pending;
    document.getElementById('retryingCount').textContent = stats.retrying;
    
    if (document.getElementById('paidCount')) {
        document.getElementById('paidCount').textContent = stats.paid;
    }
    
    cachedStats = stats;
    statsDirty = false;
}

function createKeyItemHTML(keyData, index) {
    const statusClass = keyData.status === 'valid' ? 'status-valid' :
        keyData.status === 'paid' ? 'status-paid' :
        keyData.status === 'invalid' ? 'status-invalid' :
        keyData.status === 'rate-limited' ? 'status-rate-limited' :
        keyData.status === 'retrying' ? 'status-retrying' : 'status-testing';
    
    const statusText = translations[currentLang]['status-' + keyData.status] || keyData.status;
    
    let errorDisplay = '';
    if ((keyData.status === 'invalid' || keyData.status === 'rate-limited') && keyData.error) {
        const localizedError = getLocalizedError(keyData.error);
        const errorColor = keyData.status === 'rate-limited' ? '#856404' : '#dc3545';
        errorDisplay = `<div style="font-size: 11px; color: ${errorColor}; margin-top: 2px;">${localizedError}</div>`;
    }
    
    let modelDisplay = '';
    if (keyData.model) {
        modelDisplay = `<div style="font-size: 11px; color: #6c757d; margin-top: 2px;">Model: ${keyData.model}</div>`;
    }
    
    let retryDisplay = '';
    if (keyData.retryCount && keyData.retryCount > 0) {
        const retryText = currentLang === 'zh' ? '重试' : 'Retry';
        retryDisplay = `<div style="font-size: 11px; color: #f39c12; margin-top: 2px;">${retryText}: ${keyData.retryCount}</div>`;
    }
    
    return `
        <div class="key-item">
            <div class="key-text">${keyData.key}${modelDisplay}${errorDisplay}${retryDisplay}</div>
            <div class="key-status ${statusClass}">${statusText}</div>
        </div>
    `;
}

function updateKeyListOptimized(elementId, keys) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    // 如果数据量小，使用原有的直接渲染方式
    if (keys.length < LARGE_DATA_THRESHOLD) {
        updateKeyListClassic(elementId, keys);
        return;
    }
    
    // 大数据量时使用虚拟列表
    if (!virtualLists[elementId]) {
        container.innerHTML = '';
        virtualLists[elementId] = new VirtualList(container, 60, 10);
        virtualLists[elementId].setRenderItem(createKeyItemHTML);
    }
    
    virtualLists[elementId].setData(keys);
}

function updateKeyListClassic(elementId, keys) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    // 销毁可能存在的虚拟列表
    if (virtualLists[elementId]) {
        virtualLists[elementId].destroy();
        delete virtualLists[elementId];
    }
    
    container.innerHTML = '';
    
    if (keys.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        let emptyMessage = '';
        switch (elementId) {
            case 'allKeys':
                emptyMessage = currentLang === 'zh' ? '暂无密钥' : 'No keys';
                break;
            case 'validKeys':
                emptyMessage = currentLang === 'zh' ? '暂无有效密钥' : 'No valid keys';
                break;
            case 'paidKeys':
                emptyMessage = currentLang === 'zh' ? '暂无付费密钥' : 'No paid keys';
                break;
            case 'invalidKeys':
                emptyMessage = currentLang === 'zh' ? '暂无无效密钥' : 'No invalid keys';
                break;
            case 'rateLimitedKeys':
                emptyMessage = currentLang === 'zh' ? '暂无速率限制密钥' : 'No rate limited keys';
                break;
            default:
                emptyMessage = currentLang === 'zh' ? '暂无数据' : 'No data';
        }
        emptyState.innerHTML = '<div class="empty-icon">📭</div><div class="empty-text">' + emptyMessage + '</div>';
        container.appendChild(emptyState);
        return;
    }
    
    // 使用 DocumentFragment 优化DOM操作
    const fragment = document.createDocumentFragment();
    keys.forEach(keyData => {
        const keyItem = document.createElement('div');
        keyItem.className = 'key-item';
        keyItem.innerHTML = createKeyItemHTML(keyData).replace('<div class="key-item">', '').replace('</div>', '').slice(0, -13);
        
        const statusClass = keyData.status === 'valid' ? 'status-valid' :
            keyData.status === 'paid' ? 'status-paid' :
            keyData.status === 'invalid' ? 'status-invalid' :
            keyData.status === 'rate-limited' ? 'status-rate-limited' :
            keyData.status === 'retrying' ? 'status-retrying' : 'status-testing';
        const statusText = translations[currentLang]['status-' + keyData.status] || keyData.status;
        
        let errorDisplay = '';
        if ((keyData.status === 'invalid' || keyData.status === 'rate-limited') && keyData.error) {
            const localizedError = getLocalizedError(keyData.error);
            const errorColor = keyData.status === 'rate-limited' ? '#856404' : '#dc3545';
            errorDisplay = '<div style="font-size: 11px; color: ' + errorColor + '; margin-top: 2px;">' + localizedError + '</div>';
        }
        
        let modelDisplay = '';
        if (keyData.model) {
            modelDisplay = '<div style="font-size: 11px; color: #6c757d; margin-top: 2px;">Model: ' + keyData.model + '</div>';
        }
        
        let retryDisplay = '';
        if (keyData.retryCount && keyData.retryCount > 0) {
            const retryText = currentLang === 'zh' ? '重试' : 'Retry';
            retryDisplay = '<div style="font-size: 11px; color: #f39c12; margin-top: 2px;">' + retryText + ': ' + keyData.retryCount + '</div>';
        }
        
        keyItem.innerHTML = '<div class="key-text">' + keyData.key + modelDisplay + errorDisplay + retryDisplay + '</div><div class="key-status ' + statusClass + '">' + statusText + '</div>';
        fragment.appendChild(keyItem);
    });
    
    container.appendChild(fragment);
}

function updateKeyListsOptimized() {
    const validKeys = getFilteredKeys('valid');
    const invalidKeys = getFilteredKeys('invalid');
    const rateLimitedKeys = getFilteredKeys('rate-limited');
    const paidKeys = getFilteredKeys('paid');
    
    updateKeyListOptimized('allKeys', allKeysData);
    updateKeyListOptimized('validKeys', validKeys);
    updateKeyListOptimized('invalidKeys', invalidKeys);
    updateKeyListOptimized('rateLimitedKeys', rateLimitedKeys);
    
    if (document.getElementById('paidKeys')) {
        updateKeyListOptimized('paidKeys', paidKeys);
    }
}

// 优化的UI更新函数
function updateUIAsyncOptimized() {
    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_THROTTLE) return;
    
    if (updateTimer) return;
    updateTimer = setTimeout(() => {
        try { updateStatsOptimized(); } catch (_) {}
        try { updateKeyListsOptimized(); } catch (_) {}
        updateTimer = null;
        lastUpdateTime = Date.now();
    }, UPDATE_THROTTLE);
}

// 在数据变化时调用
function onDataChanged() {
    invalidateCache();
    updateUIAsyncOptimized();
}

// 批量操作：避免频繁的单个更新
function batchUpdate(operations) {
    // 暂时禁用UI更新
    const oldUpdateTimer = updateTimer;
    updateTimer = -1; // 标记为禁用状态
    
    try {
        operations.forEach(op => op());
    } finally {
        updateTimer = oldUpdateTimer;
        onDataChanged(); // 批量操作完成后统一更新UI
    }
}

// 内存优化：定期清理不必要的缓存
function performanceCleanup() {
    if (filterCache.size > 50) {
        filterCache.clear();
        cacheVersion++;
    }
}

// 每5分钟清理一次缓存
setInterval(performanceCleanup, 5 * 60 * 1000);

try {
    if (typeof window !== 'undefined') {
        window.updateUIAsyncOptimized = updateUIAsyncOptimized;
        window.onDataChanged = onDataChanged;
        window.batchUpdate = batchUpdate;
        window.invalidateCache = invalidateCache;
        window.updateStatsOptimized = updateStatsOptimized;
        window.updateKeyListsOptimized = updateKeyListsOptimized;
    }
} catch (_) {}
