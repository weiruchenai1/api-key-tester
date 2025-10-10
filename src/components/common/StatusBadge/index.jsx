import React from 'react';

const StatusBadge = ({
  status,
  children,
  className = '',
  size = 'default',
  ...props
}) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'valid': return 'status-valid';
      case 'paid': return 'status-paid';
      case 'invalid': return 'status-invalid';
      case 'rate-limited': return 'status-rate-limited';
      case 'retrying': return 'status-retrying';
      case 'testing': return 'status-testing';
      default: return 'status-testing';
    }
  };

  const baseClass = 'key-status';
  const statusClass = getStatusClass(status);
  const sizeClass = size === 'small' ? 'key-status--small' : 
                   size === 'large' ? 'key-status--large' : '';
  
  const classes = [baseClass, statusClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div 
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
};

export default StatusBadge;