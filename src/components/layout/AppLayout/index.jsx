import React from 'react';
import NavBar from '../NavBar';
import styles from './AppLayout.module.css';

const AppLayout = ({ children }) => {
  return (
    <div className={styles.appLayout}>
      <NavBar />
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <div className={styles.twoColumnLayout}>
            <div className={styles.leftColumn}>
              <div className={styles.functionArea}>
                {/* 左侧功能区内容将由子组件填充 */}
                {children?.leftPanel}
              </div>
            </div>
            <div className={styles.rightColumn}>
              <div className={styles.statusArea}>
                {/* 右侧状态区内容将由子组件填充 */}
                {children?.rightPanel}
              </div>
            </div>
          </div>
          {/* 保持向后兼容，如果没有传递leftPanel和rightPanel，则正常渲染children */}
          {!children?.leftPanel && !children?.rightPanel && children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
