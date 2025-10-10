import React from 'react';

const Card = ({
  children,
  title,
  action,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'function':
        return 'card--primary';
      case 'base':
        return 'card-base';
      case 'usage':
        return 'card--primary card--info';
      default:
        return 'card-base';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'card-padding-sm';
      case 'md':
        return 'card-padding';
      case 'lg':
        return 'p-lg';
      default:
        return 'card-padding';
    }
  };

  const baseClass = getVariantClass();
  const paddingClass = getPaddingClass();
  const hoverClass = hover ? 'card-hover' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';
  
  const classes = [
    baseClass,
    paddingClass,
    hoverClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      {...props}
    >
      {(title || action) && (
        <div className="card-header flex items-center justify-between mb-4">
          {title && <h3 className="card-title text-lg font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;