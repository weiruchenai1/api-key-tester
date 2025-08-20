// 虚拟列表组件 - 优化大量数据渲染性能
class VirtualList {
    constructor(container, itemHeight = 60, bufferSize = 10) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.bufferSize = bufferSize;
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.data = [];
        this.renderItem = null;
        
        this.init();
    }
    
    init() {
        // 创建滚动容器
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.style.cssText = `
            height: 100%;
            overflow-y: auto;
            position: relative;
        `;
        
        // 创建内容容器（用于撑开滚动高度）
        this.totalContainer = document.createElement('div');
        this.totalContainer.style.position = 'relative';
        
        // 创建可视区域容器
        this.visibleContainer = document.createElement('div');
        this.visibleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
        `;
        
        this.totalContainer.appendChild(this.visibleContainer);
        this.scrollContainer.appendChild(this.totalContainer);
        this.container.appendChild(this.scrollContainer);
        
        // 绑定滚动事件
        this.scrollContainer.addEventListener('scroll', () => this.onScroll());
        
        // 监听窗口大小变化
        this.resizeObserver = new ResizeObserver(() => this.updateLayout());
        this.resizeObserver.observe(this.container);
    }
    
    setData(data) {
        this.data = data;
        this.updateLayout();
        this.render();
    }
    
    setRenderItem(renderFn) {
        this.renderItem = renderFn;
    }
    
    updateLayout() {
        this.containerHeight = this.container.clientHeight;
        this.totalHeight = this.data.length * this.itemHeight;
        this.totalContainer.style.height = this.totalHeight + 'px';
        
        this.calculateVisibleRange();
    }
    
    calculateVisibleRange() {
        const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
        const visibleEnd = Math.min(
            this.data.length - 1,
            Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight)
        );
        
        this.startIndex = Math.max(0, visibleStart - this.bufferSize);
        this.endIndex = Math.min(this.data.length - 1, visibleEnd + this.bufferSize);
    }
    
    onScroll() {
        const newScrollTop = this.scrollContainer.scrollTop;
        if (Math.abs(newScrollTop - this.scrollTop) < this.itemHeight / 2) return;
        
        this.scrollTop = newScrollTop;
        this.calculateVisibleRange();
        this.render();
    }
    
    render() {
        if (!this.renderItem) return;
        
        // 清空可视容器
        this.visibleContainer.innerHTML = '';
        
        // 设置容器位置
        this.visibleContainer.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;
        
        // 渲染可视范围内的项目
        for (let i = this.startIndex; i <= this.endIndex; i++) {
            if (i >= this.data.length) break;
            
            const item = document.createElement('div');
            item.style.height = this.itemHeight + 'px';
            item.innerHTML = this.renderItem(this.data[i], i);
            this.visibleContainer.appendChild(item);
        }
    }
    
    scrollToTop() {
        this.scrollContainer.scrollTop = 0;
    }
    
    destroy() {
        this.resizeObserver?.disconnect();
        this.container.innerHTML = '';
    }
}

// 导出到全局
try {
    if (typeof window !== 'undefined') {
        window.VirtualList = VirtualList;
    }
} catch (_) {}
