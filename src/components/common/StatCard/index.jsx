import React from 'react';

const StatCard = ({
  value,
  label,
  variant = 'default',
  size = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const baseClass = 'stat-card';
  const sizeClass = size === 'large' ? 'stat-card--large' : '';
  const classes = [baseClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  const numberClasses = ['stat-number', variant]
    .filter(Boolean)
    .join(' ');

  return (
    <div 
      className={classes}
      onClick={onClick}
      {...props}
    >
      <div className={numberClasses}>
        {value}
      </div>
      <div className="stat-label">
        {label}
      </div>
    </div>
  );
};

export default StatCard;