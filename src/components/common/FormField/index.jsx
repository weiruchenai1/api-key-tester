import React, { useRef } from 'react';

const FormField = ({
  label,
  children,
  error,
  help,
  required = false,
  className = '',
  ...props
}) => {
  const idRef = useRef(props.id || `field-${Math.random().toString(36).substr(2, 9)}`);
  const fieldId = idRef.current;
  const describedBy = [
    error ? `${fieldId}-error` : null,
    help ? `${fieldId}-help` : null
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`input-group ${className}`} {...props}>
      {label && (
        <label htmlFor={fieldId} className="label-base">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        const type = child.type;
        const tag = typeof type === 'string' ? type : type?.displayName;
        const isFormControl = ['input', 'textarea', 'select', 'Input'].includes(tag);
        const childId = child.props.id || fieldId;
        const extraProps = isFormControl ? { id: childId, 'aria-invalid': !!error, 'aria-describedby': describedBy } : {};
        return React.cloneElement(child, { ...child.props, ...extraProps });
      })}
      {error && (
        <div id={`${fieldId}-error`} className="text-error text-sm mt-1">
          {error}
        </div>
      )}
      {help && (
        <div id={`${fieldId}-help`} className="form-help">
          {help}
        </div>
      )}
    </div>
  );
};

const Input = React.forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'default',
  error,
  className = '',
  ...props
}, ref) => {
  const baseClass = 'form-control';
  const variantClass = type === 'textarea' ? 'textarea' : '';
  const errorClass = error ? 'error' : '';
  const sizeClass = size === 'small' ? 'form-control--sm' : 
                   size === 'large' ? 'form-control--lg' : '';

  const classes = [baseClass, variantClass, errorClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  if (type === 'textarea') {
    return (
      <textarea
        ref={ref}
        className={classes}
        {...props}
      />
    );
  }

  return (
    <input
      ref={ref}
      type={type}
      className={classes}
      {...props}
    />
  );
});

Input.displayName = 'Input';

FormField.Input = Input;

export default FormField;