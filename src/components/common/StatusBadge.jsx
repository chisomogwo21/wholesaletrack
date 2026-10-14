import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  CheckCheck, 
  XCircle 
} from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    classes: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
  },
  packed: {
    label: 'Packed',
    icon: Package,
    classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  dispatched: {
    label: 'Dispatched',
    icon: Truck,
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-600',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCheck,
    classes: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    dot: 'bg-emerald-700',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    classes: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
  },
};

export default function StatusBadge({ status, showIcon = true, className = '' }) {
  const normalized = (status || '').toLowerCase();
  const config = STATUS_CONFIG[normalized] || {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown',
    icon: Clock,
    classes: 'bg-neutral/40 text-primary border-border',
    dot: 'bg-muted',
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      {!showIcon && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      <span>{config.label}</span>
    </span>
  );
}
