import { useCallback } from 'react';

export const useVirtualization = () => {
  const getItemHeight = useCallback(() => {
    // 根据屏幕大小返回固定高度
    if (window.matchMedia && window.matchMedia('(max-width: 480px)').matches) {
      return 62; // 超小屏幕：60px + wrapper padding(2px)
    } else if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
      return 66; // 移动端：64px + wrapper padding(2px)
    } else {
      return 74; // 桌面端：72px + wrapper padding(2px)
    }
  }, []);

  return {
    getItemHeight,
    getListHeight: () => 350
  };
};
