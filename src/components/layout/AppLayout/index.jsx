import React, { useState, useEffect } from 'react';
import NavBar from '../NavBar';
import Sidebar from '../Sidebar';
import styles from './AppLayout.module.css';

const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // 默认折叠

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // 移动端默认折叠
        setIsSidebarCollapsed(true);
      }
      // PC端保持用户选择的状态，不自动更改
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.appLayout}>
      <NavBar
        onSidebarToggle={setIsSidebarCollapsed}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className={`${styles.mainWrapper} ${!isSidebarCollapsed ? styles.sidebarExpanded : ''}`}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            <div className={styles.twoColumnLayout}>
              <div className={styles.leftColumn}>
                <div className={styles.functionArea}>
                  {children?.leftPanel}
                </div>
              </div>
              <div className={styles.rightColumn}>
                <div className={styles.statusArea}>
                  {children?.rightPanel}
                </div>
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
