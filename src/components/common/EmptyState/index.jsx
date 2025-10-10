import React from 'react';

const EmptyState = ({
  icon = '📭',
  title,
  message,
  children,
  className = '',
  size = 'default',
  ...props
}) => {
  const sizeClass = size === 'small' ? 'empty-state--small' : 
                   size === 'large' ? 'empty-state--large' : '';
  
  const classes = ['empty-state', sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {icon && (
        <div className="empty-icon">
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}
      {title && (
        <div className="empty-title">
          {title}
        </div>
      )}
      {message && (
        <div className="empty-text">
          {message}
        </div>
      )}
      {children}
    </div>
  );
};

export default EmptyState;