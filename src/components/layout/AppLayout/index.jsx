import React, { useState, useEffect, useRef } from 'react';
import NavBar from '../NavBar';
import Sidebar from '../Sidebar';
import styles from './AppLayout.module.css';

const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const sidebarRef = useRef(null);
  const navBarRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 添加点击外部区域折叠侧边栏的逻辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 只有在侧边栏展开时才处理
      if (!isSidebarCollapsed) {
        // 检查点击是否在侧边栏或导航栏内部
        const isClickInsideSidebar = sidebarRef.current && sidebarRef.current.contains(event.target);
        const isClickInsideNavBar = navBarRef.current && navBarRef.current.contains(event.target);

        // 如果点击在侧边栏和导航栏外部，则折叠侧边栏
        if (!isClickInsideSidebar && !isClickInsideNavBar) {
          setIsSidebarCollapsed(true);
        }
      }
    };

    // 同时监听鼠标和触摸事件，确保移动端兼容性
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSidebarCollapsed]);

  return (
    <div className={styles.appLayout}>
      <div ref={navBarRef}>
        <NavBar
          onSidebarToggle={setIsSidebarCollapsed}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>
      <div ref={sidebarRef}>
        <Sidebar isCollapsed={isSidebarCollapsed} />
      </div>
      <div className={`${styles.mainWrapper} ${!isSidebarCollapsed ? styles.sidebarExpanded : ''}`}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            <div className={styles.twoColumnLayout}>
              <div className={styles.leftColumn}>
                {children?.leftPanel}
              </div>
              <div className={styles.rightColumn}>
                {children?.rightPanel}
              </div>
            </div>
            {!children?.leftPanel && !children?.rightPanel && children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
