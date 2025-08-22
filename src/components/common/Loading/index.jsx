import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import './Loading.module.css';

const Loading = ({ isVisible, message }) => {
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>{message || t('testing')}</p>
    </div>
  );
};

export default Loading;
