import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'link' | 'danger'
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  fullWidth = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-md disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'h-10 px-4 bg-primary text-white border border-primary hover:bg-black/85 text-sm',
    secondary: 'h-10 px-4 bg-surface text-primary border border-border hover:bg-[#F7F9F6] text-sm',
    accent: 'h-10 px-4 bg-accent text-primary border border-accent hover:brightness-95 font-semibold text-sm',
    link: 'h-auto p-0 bg-transparent text-primary hover:underline text-sm font-medium border-0',
    danger: 'h-10 px-4 bg-error text-white border border-error hover:bg-red-700 text-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Please wait...</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </span>
      )}
    </button>
  );
}
