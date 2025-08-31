import { useState, useCallback, useEffect } from 'react';

export const useVirtualization = () => {
  const [listHeight, setListHeight] = useState(400);

  // 动态计算项目高度 - 更精确的计算
  const getItemHeight = useCallback((keyData) => {
    // 基础高度：padding(12*2=24) + wrapper padding(4*2=8) + 基础内容(40) = 72px
    let baseHeight = 72;

    // 每行额外内容的高度
    const lineHeight = 16;

    // 如果有模型信息，增加一行
    if (keyData && keyData.model) {
      baseHeight += lineHeight;
    }

    // 如果有错误信息，增加一行
    if (keyData && keyData.error) {
      baseHeight += lineHeight;
    }

    // 如果有重试信息，增加一行
    if (keyData && keyData.retryCount > 0) {
      baseHeight += lineHeight;
    }

    return baseHeight;
  }, []);

  const getListHeight = useCallback(() => {
    // 获取结果容器的实际可用高度
    const resultsContainer = document.querySelector('.results-content');
    if (resultsContainer) {
      const containerRect = resultsContainer.getBoundingClientRect();
      return Math.max(200, containerRect.height - 20); // 减去一些边距
    }

    // 如果无法获取容器，使用动态计算
    const windowHeight = window.innerHeight;
    const navbarHeight = 60;
    const statsHeight = 120; // 统计卡片区域
    const tabsHeight = 50;   // 标签页高度
    const buttonHeight = 60; // 复制按钮区域高度
    const padding = 100;     // 各种边距和内边距

    const availableHeight = windowHeight - navbarHeight - statsHeight - tabsHeight - buttonHeight - padding;
    return Math.max(200, Math.min(500, availableHeight));
  }, []);

  const updateListHeight = useCallback(() => {
    const newHeight = getListHeight();
    setListHeight(newHeight);
  }, [getListHeight]);

  useEffect(() => {
    // 初始计算
    setTimeout(() => {
      updateListHeight();
    }, 100);

    let orientationTimeout;

    const handleResize = () => {
      updateListHeight();
    };

    const handleOrientationChange = () => {
      orientationTimeout = setTimeout(updateListHeight, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (orientationTimeout) {
        clearTimeout(orientationTimeout);
      }
    };
  }, [updateListHeight]);

  return {
    listHeight,
    getItemHeight,
    getListHeight: () => listHeight
  };
};
