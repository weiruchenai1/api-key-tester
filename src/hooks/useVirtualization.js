import { useState, useCallback, useEffect } from 'react';

export const useVirtualization = () => {
  const [listHeight, setListHeight] = useState(300);

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

    // 如果有有效密钥信息，增加一行
    if (keyData && keyData.status === 'valid' && keyData.cacheApiStatus) {
      baseHeight += lineHeight;
    }

    return baseHeight;
  }, []);

  const getListHeight = useCallback(() => {
    // 使用固定高度，确保与左侧卡片高度协调
    return 300;
  }, []);

  const updateListHeight = useCallback(() => {
    const newHeight = getListHeight();
    setListHeight(newHeight);
  }, [getListHeight]);

  useEffect(() => {
    updateListHeight();

    const handleResize = () => {
      updateListHeight();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateListHeight]);

  return {
    listHeight,
    getItemHeight,
    getListHeight: () => listHeight
  };
};
