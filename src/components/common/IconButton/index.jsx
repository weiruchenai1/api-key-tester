import React from 'react';
import Button from '../Button';

const IconButton = ({
  icon,
  onClick,
  disabled = false,
  variant = 'ghost',
  size = 'small',
  className = '',
  title,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={`icon-button ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default IconButton;