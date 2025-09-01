import { useState, useCallback, useEffect } from 'react';

export const useVirtualization = () => {
  const getItemHeight = useCallback((keyData) => {
    // 基础高度：padding(10*2=20) + wrapper padding(2*2=4) + 基础内容(30) = 54px
    let baseHeight = 54;

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

    // 如果有状态信息（有效密钥信息），增加一行
    if (keyData && (keyData.status === 'valid' || keyData.status === 'paid')) {
      baseHeight += lineHeight;
    }

    return Math.max(baseHeight, 54); // 设置最小高度
  }, []);

  return {
    getItemHeight,
    getListHeight: () => 350
  };
};
