import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatRWF, formatDate } from '../utils/format';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import {
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Calendar,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const TRACKING_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
];

function formatStepTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setSearched(true);
    setNotFound(false);
    setOrderData(null);

    try {
      // ONLY call the RPC track_order; do not query any table directly
      const { data, error } = await supabase.rpc('track_order', {
        p_order_number: orderNumber.trim(),
        p_phone: phone.trim(),
      });

      if (error || !data) {
        setNotFound(true);
        setOrderData(null);
      } else {
        setOrderData(data);
        setNotFound(false);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setNotFound(true);
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // Build timestamps map from orderData.history
  const historyMap = {};
  if (orderData && Array.isArray(orderData.history)) {
    orderData.history.forEach((h) => {
      if (h.status) {
        historyMap[h.status.toLowerCase()] = h.at;
      }
    });
  }
  if (orderData && !historyMap['pending'] && orderData.created_at) {
    historyMap['pending'] = orderData.created_at;
  }

  const currentStatus = (orderData?.status || '').toLowerCase();
  const isCancelled = currentStatus === 'cancelled';
  const currentStepIndex = TRACKING_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-primary flex flex-col">
      {/* Top Navigation with Staff login link in corner */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-base font-bold tracking-tight text-primary hover:opacity-90 transition-opacity"
          >
            WholesaleTrack
          </Link>
          <Link
            to="/login"
            className="text-xs font-medium text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>Staff login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Track your order
          </h1>
          <p className="text-muted text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Enter the order number from your invoice and the phone number you gave us
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-surface border border-border rounded-md p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label htmlFor="order-number" className="block text-xs font-semibold text-muted mb-1.5">
                Order number
              </label>
              <input
                id="order-number"
                type="text"
                placeholder="e.g. WT-1001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                autoFocus
                className="w-full bg-surface text-sm border border-[#D7DDD6] py-2.5 px-3 rounded-none focus:outline-none focus:border-primary placeholder:text-muted/60"
              />
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-xs font-semibold text-muted mb-1.5">
                Phone number
              </label>
              <input
                id="phone-number"
                type="tel"
                placeholder="e.g. 0788123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-surface text-sm border border-[#D7DDD6] py-2.5 px-3 rounded-none focus:outline-none focus:border-primary placeholder:text-muted/60"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-2 h-11 text-sm font-semibold"
            >
              <Search className="w-4 h-4 mr-1.5" />
              <span>Track order</span>
            </Button>
          </form>
        </div>

        {/* Not Found State */}
        {searched && !loading && notFound && (
          <div className="mt-6 bg-surface border border-border rounded-md p-6 text-center shadow-sm">
            <div className="w-10 h-10 rounded-full bg-neutral/40 text-muted mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-sm text-primary font-medium">
              We couldn't find an order with those details. Check the order number and phone number and try again.
            </p>
          </div>
        )}

        {/* Found Order Results Card */}
        {orderData && !loading && (
          <div className="mt-8 bg-surface border border-border rounded-md shadow-sm divide-y divide-border overflow-hidden">
            {/* Header: Order Number, Customer, Date, Status */}
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-muted block">Order number</span>
                  <span className="text-xl font-bold text-primary">
                    {orderData.order_number}
                  </span>
                </div>
                <div>
                  <StatusBadge status={orderData.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-muted block">Customer</span>
                  <span className="font-semibold text-primary mt-0.5 block">
                    {orderData.customer_name || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-muted block">Order date</span>
                  <span className="font-medium text-primary mt-0.5 block">
                    {formatDate(orderData.created_at)}
                  </span>
                </div>

                {orderData.driver_name ? (
                  <div>
                    <span className="text-muted block">Assigned driver</span>
                    <span className="font-semibold text-primary mt-0.5 inline-flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>{orderData.driver_name}</span>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Horizontal Progress Tracker */}
            <div className="p-6 bg-[#F7F9F6]/40">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-5">
                Delivery progress
              </h3>

              {isCancelled ? (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start gap-3">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-sm block">Cancelled</span>
                    <p>This order was cancelled.</p>
                    {historyMap.cancelled && (
                      <p className="text-red-700/80">
                        Recorded on: {formatDate(historyMap.cancelled)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Responsive Horizontal Timeline */
                <div className="overflow-x-auto pb-2 scrollbar-none">
                  <div className="min-w-[460px] sm:min-w-0 relative px-2">
                    {/* Connecting background line */}
                    <div className="absolute top-4 left-6 right-6 h-0.5 bg-border -z-0" />
                    {/* Highlighted progress line */}
                    <div
                      className="absolute top-4 left-6 h-0.5 bg-primary transition-all duration-300 -z-0"
                      style={{
                        width: `${
                          currentStepIndex >= 0
                            ? (Math.min(currentStepIndex, TRACKING_STEPS.length - 1) /
                                (TRACKING_STEPS.length - 1)) *
                              100
                            : 0
                        }%`,
                      }}
                    />

                    {/* Steps */}
                    <div className="flex items-start justify-between relative z-10">
                      {TRACKING_STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const stepTime = historyMap[step.key];

                        return (
                          <div
                            key={step.key}
                            className="flex flex-col items-center text-center w-20 sm:w-24 shrink-0"
                          >
                            <div
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isCompleted
                                  ? 'bg-primary border-primary text-white'
                                  : 'bg-surface border-border text-muted'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span className="text-xs font-semibold">{idx + 1}</span>
                              )}
                            </div>

                            <span
                              className={`text-xs font-semibold mt-2 ${
                                isCurrent
                                  ? 'text-primary font-bold'
                                  : isCompleted
                                  ? 'text-primary'
                                  : 'text-muted'
                              }`}
                            >
                              {step.label}
                            </span>

                            <span className="text-[11px] text-muted mt-0.5 leading-tight">
                              {stepTime ? formatStepTime(stepTime) : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simple Items List with Quantities and Total */}
            <div className="p-6 space-y-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                Order items
              </h3>

              {orderData.items && orderData.items.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {orderData.items.map((item, idx) => {
                    const lineTotal = (item.unit_price || 0) * (item.quantity || 0);
                    return (
                      <div
                        key={idx}
                        className="py-3 flex items-center justify-between text-sm gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-primary block truncate">
                            {item.product}
                          </span>
                          <span className="text-xs text-muted">
                            Qty: {item.quantity} {item.unit_price ? `× ${formatRWF(item.unit_price)}` : ''}
                          </span>
                        </div>
                        <span className="font-semibold text-primary whitespace-nowrap">
                          {formatRWF(lineTotal || (item.unit_price * item.quantity))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted">No items recorded for this order.</p>
              )}

              {/* Total */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-base">
                <span className="font-semibold text-muted">Total:</span>
                <span className="text-lg font-bold text-primary">
                  {formatRWF(orderData.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-surface text-center text-xs text-muted">
        WholesaleTrack &copy; {new Date().getFullYear()} &bull; Order tracking
      </footer>
    </div>
  );
}
