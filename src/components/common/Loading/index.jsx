import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';

const Loading = ({ isVisible, message }) => {
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center p-lg">
      <div className="loading-spinner mb-md"></div>
      <p className="text-sm text-secondary">{message || t('testing')}</p>
    </div>
  );
};

export default Loading;
