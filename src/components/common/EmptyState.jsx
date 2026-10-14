import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'No data currently exists for this section or criteria.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`border border-border bg-surface p-10 rounded-md flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 bg-[#F7F9F6] border border-border rounded-full flex items-center justify-center text-muted mb-4">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <h3 className="font-semibold text-base text-primary mb-1">
        {title}
      </h3>

      <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="h-10 px-4 text-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
