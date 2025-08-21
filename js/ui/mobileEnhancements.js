/**
 * 移动端交互增强模块
 * 提供触摸友好的交互体验和手势支持
 */

class MobileEnhancements {
    constructor() {
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isScrolling = false;
        this.lastTouchTime = 0;
        
        this.init();
    }
    
    init() {
        if (!this.isTouch) return;
        
        this.setupTouchEvents();
        this.setupSwipeGestures();
        this.setupDoubleTapPrevention();
        this.setupScrollOptimizations();
        this.setupVirtualKeyboardHandling();
        this.setupOrientationHandling();
        
        console.log('[Mobile] 移动端增强功能已启用');
    }
    
    /**
     * 设置触摸事件处理
     */
    setupTouchEvents() {
        // 为所有按钮添加触摸反馈
        document.addEventListener('touchstart', (e) => {
            const button = e.target.closest('.btn, .tab, .preset-btn, .retry-preset-btn, .control-btn, .copy-btn');
            if (button) {
                button.classList.add('touch-active');
                
                // 触觉反馈（如果支持）
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const button = e.target.closest('.btn, .tab, .preset-btn, .retry-preset-btn, .control-btn, .copy-btn');
            if (button) {
                setTimeout(() => {
                    button.classList.remove('touch-active');
                }, 150);
            }
        }, { passive: true });
        
        // 添加触摸样式
        const style = document.createElement('style');
        style.textContent = `
            .touch-active {
                opacity: 0.7 !important;
                transform: scale(0.98) !important;
                transition: all 0.1s ease !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 设置滑动手势支持
     */
    setupSwipeGestures() {
        const tabsContainer = document.querySelector('.results-tabs');
        if (!tabsContainer) return;
        
        let startX = 0;
        let startY = 0;
        let isHorizontalSwipe = false;
        
        tabsContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isHorizontalSwipe = false;
        }, { passive: true });
        
        tabsContainer.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);
            
            // 判断是否为横向滑动
            if (diffX > diffY && diffX > 30) {
                isHorizontalSwipe = true;
                e.preventDefault();
                
                // 滚动标签页
                const scrollAmount = startX - currentX;
                tabsContainer.scrollLeft += scrollAmount * 0.5;
                startX = currentX;
            }
        }, { passive: false });
        
        tabsContainer.addEventListener('touchend', () => {
            startX = 0;
            startY = 0;
            isHorizontalSwipe = false;
        }, { passive: true });
    }
    
    /**
     * 防止双击缩放
     */
    setupDoubleTapPrevention() {
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this.lastTouchTime < 300) {
                e.preventDefault();
            }
            this.lastTouchTime = now;
        }, { passive: false });
    }
    
    /**
     * 滚动优化
     */
    setupScrollOptimizations() {
        // 为滚动容器添加平滑滚动
        const scrollContainers = document.querySelectorAll('.key-list, .model-list-container, .results-tabs');
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.scrollBehavior = 'smooth';
        });
        
        // 防止过度滚动
        document.addEventListener('touchmove', (e) => {
            const target = e.target.closest('.key-list, .model-list-container');
            if (target) {
                const { scrollTop, scrollHeight, clientHeight } = target;
                
                if (scrollTop === 0 && e.touches[0].clientY > this.touchStartY) {
                    e.preventDefault();
                } else if (scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY < this.touchStartY) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });
    }
    
    /**
     * 虚拟键盘处理
     */
    setupVirtualKeyboardHandling() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // 延迟滚动到输入框，等待虚拟键盘出现
                setTimeout(() => {
                    input.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
                
                // 添加聚焦样式
                input.closest('.input-group')?.classList.add('input-focused');
            });
            
            input.addEventListener('blur', () => {
                input.closest('.input-group')?.classList.remove('input-focused');
            });
        });
        
        // 添加聚焦样式
        const style = document.createElement('style');
        style.textContent = `
            .input-focused {
                transform: scale(1.02);
                z-index: 10;
                position: relative;
            }
            
            @media (max-width: 768px) {
                .input-focused {
                    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
                    border-radius: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 屏幕方向变化处理
     */
    setupOrientationHandling() {
        let orientationChangeTimeout;
        
        const handleOrientationChange = () => {
            clearTimeout(orientationChangeTimeout);
            orientationChangeTimeout = setTimeout(() => {
                // 重新计算布局
                this.recalculateLayout();
                
                // 触发窗口resize事件
                window.dispatchEvent(new Event('resize'));
                
                console.log('[Mobile] 屏幕方向已改变，布局已调整');
            }, 300);
        };
        
        // 监听方向变化
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            window.addEventListener('orientationchange', handleOrientationChange);
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            clearTimeout(orientationChangeTimeout);
            orientationChangeTimeout = setTimeout(() => {
                this.recalculateLayout();
            }, 100);
        });
    }
    
    /**
     * 重新计算布局
     */
    recalculateLayout() {
        // 重新设置容器高度
        const container = document.querySelector('.container');
        if (container) {
            const vh = window.innerHeight;
            container.style.minHeight = `${vh - 10}px`;
        }
        
        // 调整键盘列表高度
        const keyLists = document.querySelectorAll('.key-list');
        keyLists.forEach(list => {
            const isLandscape = window.innerWidth > window.innerHeight;
            const maxHeight = isLandscape ? '200px' : '300px';
            list.style.maxHeight = maxHeight;
        });
        
        // 重新计算统计卡片布局
        const stats = document.querySelector('.stats');
        if (stats && window.innerWidth <= 480) {
            const isLandscape = window.innerWidth > window.innerHeight;
            stats.style.gridTemplateColumns = isLandscape ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)';
        }
    }
    
    /**
     * 添加长按支持
     */
    setupLongPress() {
        let longPressTimer;
        let isLongPress = false;
        
        document.addEventListener('touchstart', (e) => {
            const keyItem = e.target.closest('.key-item');
            if (!keyItem) return;
            
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                this.handleLongPress(keyItem);
            }, 800);
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
    }
    
    /**
     * 处理长按事件
     */
    handleLongPress(keyItem) {
        const keyText = keyItem.querySelector('.key-text')?.textContent;
        if (!keyText) return;
        
        // 触觉反馈
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // 显示上下文菜单
        this.showContextMenu(keyItem, keyText);
    }
    
    /**
     * 显示上下文菜单
     */
    showContextMenu(element, keyText) {
        // 移除现有菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // 创建上下文菜单
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="copy">复制密钥</div>
            <div class="context-menu-item" data-action="test">单独测试</div>
        `;
        
        // 定位菜单
        const rect = element.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.top - 60}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';
        
        document.body.appendChild(menu);
        
        // 添加菜单样式
        if (!document.querySelector('#context-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'context-menu-styles';
            style.textContent = `
                .context-menu {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    overflow: hidden;
                    animation: contextMenuFadeIn 0.2s ease;
                }
                
                .context-menu-item {
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                    transition: background 0.2s ease;
                }
                
                .context-menu-item:last-child {
                    border-bottom: none;
                }
                
                .context-menu-item:hover {
                    background: #f5f5f5;
                }
                
                .dark-theme .context-menu {
                    background: #2a2d47;
                    border-color: #3c4269;
                }
                
                .dark-theme .context-menu-item {
                    color: #e8eaed;
                    border-bottom-color: #3c4269;
                }
                
                .dark-theme .context-menu-item:hover {
                    background: #323556;
                }
                
                @keyframes contextMenuFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 处理菜单点击
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'copy') {
                navigator.clipboard.writeText(keyText);
                this.showToast('密钥已复制');
            } else if (action === 'test') {
                this.showToast('单独测试功能开发中');
            }
            menu.remove();
        });
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }
    
    /**
     * 显示提示消息
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        
        // 添加样式
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .mobile-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 14px;
                    z-index: 10000;
                    animation: toastFadeIn 0.3s ease, toastFadeOut 0.3s ease 2.7s;
                    pointer-events: none;
                }
                
                @keyframes toastFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                
                @keyframes toastFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    /**
     * 检测设备类型
     */
    getDeviceType() {
        const width = window.innerWidth;
        if (width <= 320) return 'small-phone';
        if (width <= 480) return 'phone';
        if (width <= 768) return 'tablet';
        return 'desktop';
    }
    
    /**
     * 销毁移动端增强功能
     */
    destroy() {
        // 移除事件监听器和样式
        const styles = document.querySelectorAll('#context-menu-styles, #toast-styles');
        styles.forEach(style => style.remove());
        
        console.log('[Mobile] 移动端增强功能已销毁');
    }
}

// 自动初始化移动端增强功能
let mobileEnhancements;

document.addEventListener('DOMContentLoaded', () => {
    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    if (isMobile) {
        mobileEnhancements = new MobileEnhancements();
        
        // 添加长按支持
        setTimeout(() => {
            if (mobileEnhancements) {
                mobileEnhancements.setupLongPress();
            }
        }, 1000);
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileEnhancements;
} else {
    window.MobileEnhancements = MobileEnhancements;
}
