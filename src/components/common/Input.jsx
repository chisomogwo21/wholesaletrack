import React, { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    type = 'text',
    className = '',
    required = false,
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || (label ? generatedId : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-muted flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`
            w-full bg-surface text-on-surface text-sm rounded-none border py-2.5 px-3
            placeholder:text-muted/60 focus:outline-none transition-colors duration-150
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-error focus:border-error' : 'border-[#D7DDD6] focus:border-primary'}
            ${className}
          `}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-error mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
