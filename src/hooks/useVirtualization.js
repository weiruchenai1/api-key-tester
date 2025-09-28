import { useCallback } from 'react';

export const useVirtualization = () => {
  const getItemHeight = useCallback((keyData, apiType) => {
    if (!keyData) return 60; // 默认高度

    // 基础高度：padding(12*2=24) + wrapper padding(2*2=4) + 基础内容(40) = 68px
    let baseHeight = 60;

    // 计算密钥长度对高度的影响
    const keyLength = keyData.key ? keyData.key.length : 0;
    if (keyLength > 60) {
      // 长密钥需要更多行来显示
      const extraLines = Math.ceil((keyLength - 60) / 60);
      baseHeight += extraLines * 18; // 每行约18px
    }

    // 每行额外内容的高度
    const lineHeight = 16;

    // 如果有模型信息，增加一行
    if (keyData.model) {
      baseHeight += lineHeight;
    }

    // 如果有错误信息，增加一行（错误信息可能较长）
    if (keyData.error) {
      const errorLength = keyData.error.length;
      if (errorLength > 50) {
        baseHeight += lineHeight * 2; // 长错误信息占两行
      } else {
        baseHeight += lineHeight;
      }
    }

    // 如果有重试信息，增加一行
    if (keyData.retryCount > 0) {
      baseHeight += lineHeight;
    }

    // 如果有状态信息（有效密钥信息），增加一行
    if (keyData.status === 'valid' || keyData.status === 'paid') {
      baseHeight += lineHeight;
    }

    // 如果是硅基流动且是有效密钥，为余额显示增加额外高度
    if (apiType === 'siliconcloud' && (keyData.status === 'valid' || keyData.status === 'paid')) {
      baseHeight += lineHeight; // 为余额显示增加一行高度
    }

    return Math.max(baseHeight, 68); // 设置最小高度为68px
  }, []);

  return {
    getItemHeight,
    getListHeight: () => 350
  };
};
