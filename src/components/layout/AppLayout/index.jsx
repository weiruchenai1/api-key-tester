import React, { useState, useEffect } from 'react';
import NavBar from '../NavBar';
import Sidebar from '../Sidebar';
import styles from './AppLayout.module.css';

const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

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
