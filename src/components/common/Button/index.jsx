import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClass = 'btn-base';
  const variantClass = variant === 'primary' ? 'btn-primary' : 
                      variant === 'secondary' ? 'btn-secondary' : 
                      variant === 'ghost' ? 'btn-ghost' : 
                      variant === 'danger' ? 'btn-danger' : 'btn-primary';
  const sizeClass = size === 'small' ? 'btn-sm' : 
                   size === 'large' ? 'btn-lg' : '';
  const classes = [baseClass, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading-spinner"></span>}
      {children}
    </button>
  );
};

export default Button;
