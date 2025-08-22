import React from 'react';
import Header from '../../common/Header';
import ThemeToggle from '../ThemeToggle';
import styles from './AppLayout.module.css';

const AppLayout = ({ children }) => {
  return (
    <div className={styles.appLayout}>
      <ThemeToggle />
      <div className={styles.container}>
        <Header />
        <div className={styles.mainContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
