import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import styles from './Header.module.css';

const Header = () => {
  const { t } = useLanguage();

  return (
    <div className={styles.header}>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
};

export default Header;
