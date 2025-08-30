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
  );
};

export default AppLayout;
