import React from 'react';

export default function LoadingSpinner({
  size = 'md', // 'sm' | 'md' | 'lg' | 'screen'
  label = 'Loading...',
}) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-2',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-2.5">
      <div
        className={`
          ${sizeMap[size] || sizeMap.md}
          border-primary/20 border-t-primary rounded-full animate-spin
        `}
      />
      {label && (
        <span className="text-xs text-muted font-medium">
          {label}
        </span>
      )}
    </div>
  );

  if (size === 'screen') {
    return (
      <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted font-medium">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return spinner;
}
