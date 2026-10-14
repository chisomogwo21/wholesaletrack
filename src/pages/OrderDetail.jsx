import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { formatRWF, formatDate } from '../utils/format';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Phone,
  Store,
  User,
  FileText,
  Printer,
  Package,
} from 'lucide-react';

const ORDER_STAGES = [
  { key: 'pending', label: 'Pending', nextKey: 'confirmed', nextLabel: 'Move to confirmed' },
  { key: 'confirmed', label: 'Confirmed', nextKey: 'packed', nextLabel: 'Move to packed' },
  { key: 'packed', label: 'Packed', nextKey: 'dispatched', nextLabel: 'Move to dispatched' },
  { key: 'dispatched', label: 'Dispatched', nextKey: 'delivered', nextLabel: 'Move to delivered' },
  { key: 'delivered', label: 'Delivered', nextKey: null, nextLabel: null },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Driver modal state (for moving to dispatched)
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverError, setDriverError] = useState('');

  // Cancel order modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const fetchOrderDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          status,
          total_amount,
          delivery_address,
          driver_name,
          notes,
          created_at,
          customers (
            id,
            name,
            business_name,
            phone,
            address
          ),
          order_items (
            id,
            quantity,
            unit_price,
            products (
              id,
              name,
              sku,
              unit,
              category
            )
          ),
          order_status_history (
            id,
            status,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
      if (data?.driver_name) {
        setDriverName(data.driver_name);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      toast.error(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Status advancement: pending -> confirmed -> packed -> dispatched -> delivered
  const handleAdvanceStatus = async () => {
    if (!order) return;
    const currentStatus = (order.status || 'pending').toLowerCase();
    const stageInfo = ORDER_STAGES.find((s) => s.key === currentStatus);

    if (!stageInfo || !stageInfo.nextKey) return;

    // When moving to dispatched, require driver name in modal
    if (stageInfo.nextKey === 'dispatched') {
      setDriverName(order.driver_name || '');
      setDriverError('');
      setIsDriverModalOpen(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      // Update only via supabase.from('orders').update(...)
      const { error } = await supabase
        .from('orders')
        .update({ status: stageInfo.nextKey })
        .eq('id', order.id);

      if (error) throw error;

      toast.success(`Order moved to ${stageInfo.nextKey}`);
      fetchOrderDetail();
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Confirm Dispatch with Driver Assignment
  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!driverName.trim()) {
      setDriverError('Driver name is required');
      return;
    }

    setUpdatingStatus(true);
    try {
      // Save status: 'dispatched' and driver_name in the same update
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'dispatched',
          driver_name: driverName.trim(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success(`Order dispatched with driver "${driverName.trim()}"`);
      setIsDriverModalOpen(false);
      fetchOrderDetail();
    } catch (err) {
      console.error('Dispatch error:', err);
      toast.error(err.message || 'Failed to dispatch order');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Confirm Cancel Order
  const handleConfirmCancel = async () => {
    setCancellingOrder(true);
    try {
      // Update only via supabase.from('orders').update(...)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Order cancelled. Stock has been restored.');
      setIsCancelModalOpen(false);
      fetchOrderDetail();
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Order not found"
        description="The requested order could not be located."
        actionLabel="Back to orders"
        onAction={() => navigate('/orders')}
      />
    );
  }

  const currentStatus = (order.status || 'pending').toLowerCase();
  const isCancelled = currentStatus === 'cancelled';
  const isDelivered = currentStatus === 'delivered';
  const stageInfo = ORDER_STAGES.find((s) => s.key === currentStatus);
  const nextStageLabel = stageInfo?.nextLabel;

  // Build timestamps map from order_status_history
  const historyMap = {};
  (order.order_status_history || []).forEach((h) => {
    if (h.status) {
      historyMap[h.status.toLowerCase()] = h.created_at;
    }
  });

  const currentStageIndex = ORDER_STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Actions (Hidden during print) */}
      <div className="print:hidden pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary mb-2 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to orders</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Order {order.order_number || order.id.substring(0, 8)}
            </h1>
            <StatusBadge status={order.status} />
          </div>

          <p className="text-xs text-muted mt-1">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Invoice Button */}
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="h-10 px-3 text-xs font-medium"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print invoice</span>
          </Button>

          {/* Cancel Order Button (Available until delivered) */}
          {!isDelivered && !isCancelled && (
            <Button
              variant="secondary"
              onClick={() => setIsCancelModalOpen(true)}
              className="h-10 px-3 text-xs font-medium text-error border-error/30 hover:bg-error/10 hover:border-error"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              <span>Cancel order</span>
            </Button>
          )}

          {/* Single "Move to <next status>" Button */}
          {nextStageLabel && !isCancelled && (
            <Button
              variant="primary"
              onClick={handleAdvanceStatus}
              loading={updatingStatus}
              className="h-10 px-4 text-xs font-semibold"
            >
              <span>{nextStageLabel}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tracking Timeline built from order_status_history (Hidden during print) */}
      <div className="print:hidden bg-surface border border-border rounded-md p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary mb-6">
          Tracking timeline
        </h3>

        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 rounded-md">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div className="text-xs space-y-1">
              <span className="font-semibold block text-sm">Order cancelled</span>
              <p>This order was cancelled. Reserved inventory was restored automatically.</p>
              {historyMap.cancelled && (
                <p className="text-muted">Cancelled on: {formatDate(historyMap.cancelled)}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 scrollbar-none">
            <div className="min-w-[460px] sm:min-w-0 relative px-2">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-border -z-0" />
              <div
                className="absolute top-4 left-6 h-0.5 bg-primary transition-all duration-300 -z-0"
                style={{
                  width: `${(Math.max(0, currentStageIndex) / (ORDER_STAGES.length - 1)) * 100}%`,
                }}
              />

              <div className="flex items-start justify-between relative z-10">
                {ORDER_STAGES.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const stageTime = historyMap[stage.key] || (idx === 0 ? order.created_at : null);

                  return (
                    <div key={stage.key} className="flex flex-col items-center text-center w-20 sm:w-28 shrink-0">
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
                        className={`text-xs font-semibold mt-2.5 ${
                          isCurrent
                            ? 'text-primary'
                            : isCompleted
                            ? 'text-primary'
                            : 'text-muted'
                        }`}
                      >
                        {stage.label}
                      </span>

                      <span className="text-[11px] text-muted mt-0.5 leading-tight">
                        {stageTime ? formatDate(stageTime) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Grid: Customer & Delivery details (Left) vs Items Table (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Delivery Cards */}
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="bg-surface border border-border rounded-md p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider pb-2 border-b border-border">
              Customer details
            </h4>

            <div>
              <span className="text-xs text-muted block">Business</span>
              <span className="font-semibold text-sm text-primary flex items-center gap-1.5 mt-0.5">
                <Store className="w-4 h-4 text-muted shrink-0" />
                {order.customers?.business_name || 'Individual customer'}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted block">Contact person</span>
              <span className="text-sm text-primary flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-muted shrink-0" />
                {order.customers?.name || '—'}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted block">Phone</span>
              <span className="text-sm text-primary flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                {order.customers?.phone || '—'}
              </span>
            </div>

            {order.customers?.address && (
              <div className="pt-2 border-t border-border/80">
                <span className="text-xs text-muted block">Registered address</span>
                <span className="text-xs text-muted block mt-0.5">
                  {order.customers.address}
                </span>
              </div>
            )}
          </div>

          {/* Delivery Details */}
          <div className="bg-surface border border-border rounded-md p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider pb-2 border-b border-border">
              Delivery details
            </h4>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Assigned driver</span>
                {!isDelivered && !isCancelled && (
                  <button
                    onClick={() => {
                      setDriverName(order.driver_name || '');
                      setDriverError('');
                      setIsDriverModalOpen(true);
                    }}
                    className="text-xs text-secondary hover:text-primary font-medium underline"
                  >
                    {order.driver_name ? 'Change driver' : 'Assign driver'}
                  </button>
                )}
              </div>
              <span className="font-semibold text-sm text-primary flex items-center gap-1.5 mt-0.5">
                <Truck className="w-4 h-4 text-muted shrink-0" />
                {order.driver_name || 'No driver assigned yet'}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted block">Delivery address</span>
              <span className="text-sm text-primary flex items-start gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                <span>{order.delivery_address || '—'}</span>
              </span>
            </div>

            {order.notes && (
              <div className="pt-2 border-t border-border/80">
                <span className="text-xs text-muted block">Notes</span>
                <span className="text-xs text-muted italic flex items-start gap-1.5 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                  <span>{order.notes}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Items Table & Grand Total */}
        <div className="md:col-span-2">
          <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-[#F7F9F6] flex items-center justify-between text-xs font-semibold text-muted">
              <span>Order items ({order.order_items?.length || 0})</span>
              <span>RWF</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="py-2.5 px-4 font-medium">Item</th>
                    <th className="py-2.5 px-4 font-medium">Unit</th>
                    <th className="py-2.5 px-4 font-medium">Price</th>
                    <th className="py-2.5 px-4 font-medium">Qty</th>
                    <th className="py-2.5 px-4 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(order.order_items || []).map((item) => {
                    const lineTotal = (item.unit_price || 0) * (item.quantity || 0);
                    return (
                      <tr key={item.id} className="hover:bg-[#F7F9F6]/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-primary">
                            {item.products?.name || 'Product'}
                          </div>
                          <div className="text-xs text-muted font-mono">
                            {item.products?.sku}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted">
                          {item.products?.unit || 'unit'}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted whitespace-nowrap">
                          {formatRWF(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 font-medium text-primary">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 font-semibold text-right text-primary whitespace-nowrap">
                          {formatRWF(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div className="p-4 bg-[#F7F9F6] border-t border-border flex flex-col items-end gap-1 text-sm">
              <div className="flex justify-between w-64 text-xs text-muted">
                <span>Subtotal:</span>
                <span className="font-medium text-primary">{formatRWF(order.total_amount)}</span>
              </div>
              <div className="flex justify-between w-64 text-xs text-muted">
                <span>Delivery:</span>
                <span className="font-medium text-emerald-700">Free</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-border text-base font-bold text-primary">
                <span>Total:</span>
                <span>{formatRWF(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Print-Friendly Invoice View (Displayed only via @media print) */}
      <div className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">WholesaleTrack</h1>
            <p className="text-xs text-gray-600 mt-1">Wholesale Distribution</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">Invoice</h2>
            <p className="text-xs mt-1">Order #{order.order_number || order.id.substring(0, 8)}</p>
            <p className="text-xs text-gray-600">Date: {formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div>
            <h3 className="font-bold mb-1">Customer</h3>
            <p className="font-semibold">{order.customers?.business_name || order.customers?.name}</p>
            <p>Attn: {order.customers?.name}</p>
            <p>Phone: {order.customers?.phone || '—'}</p>
          </div>
          <div>
            <h3 className="font-bold mb-1">Delivery</h3>
            <p>{order.delivery_address || '—'}</p>
            <p>Driver: {order.driver_name || '—'}</p>
            {order.notes && <p className="italic mt-1">Notes: {order.notes}</p>}
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="p-2 border-r border-black">SKU</th>
              <th className="p-2 border-r border-black">Item</th>
              <th className="p-2 border-r border-black text-right">Qty</th>
              <th className="p-2 border-r border-black text-right">Unit price</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {(order.order_items || []).map((item) => (
              <tr key={item.id}>
                <td className="p-2 border-r border-black">{item.products?.sku || '—'}</td>
                <td className="p-2 border-r border-black">{item.products?.name}</td>
                <td className="p-2 border-r border-black text-right">{item.quantity}</td>
                <td className="p-2 border-r border-black text-right">{formatRWF(item.unit_price)}</td>
                <td className="p-2 text-right">{formatRWF((item.unit_price || 0) * (item.quantity || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end text-xs">
          <div className="w-64 space-y-1">
            <div className="flex justify-between font-bold border-t border-black pt-2 text-sm">
              <span>Total:</span>
              <span>{formatRWF(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Assignment Dialog (when moving to dispatched) */}
      <Modal
        isOpen={isDriverModalOpen}
        onClose={() => !updatingStatus && setIsDriverModalOpen(false)}
        title="Assign delivery driver"
        subtitle="Specify the driver to mark this order as dispatched"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmDispatch} className="space-y-4">
          <Input
            label="Driver name"
            name="driverName"
            icon={Truck}
            placeholder="e.g. Jean Paul Mugisha"
            value={driverName}
            onChange={(e) => {
              setDriverName(e.target.value);
              if (e.target.value.trim()) setDriverError('');
            }}
            error={driverError}
            required
            autoFocus
          />

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsDriverModalOpen(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={updatingStatus}
            >
              Dispatch order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Order Confirmation Dialog */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !cancellingOrder && setIsCancelModalOpen(false)}
        title="Cancel order"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-primary">
            Are you sure you want to cancel Order <strong>{order.order_number || order.id.substring(0, 8)}</strong>?
          </p>
          <p className="text-xs text-muted">
            Reserved inventory items will be automatically returned to product stock by the database triggers.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={cancellingOrder}
            >
              Back
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
              loading={cancellingOrder}
            >
              Cancel order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
