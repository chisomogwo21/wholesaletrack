import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { formatRWF, formatDate } from '../utils/format';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Store,
  UserPlus,
  X,
  Check,
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [lowStockCount, setLowStockCount] = useState(0);

  // New order modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0, stock_quantity: 0, unit: '' }
  ]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Inline "Add new customer" form state
  const [showInlineCustomerForm, setShowInlineCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    business_name: '',
    address: '',
  });
  const [newCustomerErrors, setNewCustomerErrors] = useState({});
  const [savingNewCustomer, setSavingNewCustomer] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch products and low-stock count
  const fetchProductsAndStock = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, unit, unit_price, stock_quantity, reorder_level, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      const allActive = data || [];
      setProducts(allActive);

      // Low stock count: stock_quantity <= reorder_level
      const lowStock = allActive.filter((p) => p.stock_quantity <= p.reorder_level).length;
      setLowStockCount(lowStock);
    } catch (err) {
      console.warn('Error fetching products for stock count:', err);
    }
  }, []);

  // Fetch customers list for new order dropdown
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, business_name, phone, address')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.warn('Error fetching customers for order dropdown:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchProductsAndStock();
    fetchCustomers();
  }, [fetchOrders, fetchProductsAndStock, fetchCustomers]);

  // Summary counts
  const pendingOrdersCount = orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const ordersPlacedTodayCount = orders.filter((o) => {
    if (!o.created_at) return false;
    const orderDate = new Date(o.created_at);
    return orderDate >= todayStart;
  }).length;

  // Open New Order Modal
  const handleOpenNewOrder = () => {
    setSelectedCustomerId('');
    setCustomerSearch('');
    setIsCustomerDropdownOpen(false);
    setDeliveryAddress('');
    setOrderNotes('');
    setShowInlineCustomerForm(false);
    setNewCustomerData({ name: '', phone: '', business_name: '', address: '' });
    setNewCustomerErrors({});
    setOrderError('');

    // Pre-populate with first product if available
    const firstProduct = products.find((p) => p.stock_quantity > 0) || products[0];
    if (firstProduct) {
      setOrderItems([
        {
          product_id: firstProduct.id,
          quantity: 1,
          unit_price: Number(firstProduct.unit_price) || 0,
          stock_quantity: firstProduct.stock_quantity || 0,
          unit: firstProduct.unit || 'unit',
        },
      ]);
    } else {
      setOrderItems([
        { product_id: '', quantity: 1, unit_price: 0, stock_quantity: 0, unit: '' }
      ]);
    }

    setIsModalOpen(true);
  };

  // Select a customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearch(customer.business_name ? `${customer.name} (${customer.business_name})` : customer.name);
    setIsCustomerDropdownOpen(false);
    if (customer.address) {
      setDeliveryAddress(customer.address);
    }
  };

  // Inline Customer Save
  const handleSaveInlineCustomer = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newCustomerData.name.trim()) errors.name = 'Contact name is required';
    if (!newCustomerData.phone.trim()) errors.phone = 'Phone number is required';

    if (Object.keys(errors).length > 0) {
      setNewCustomerErrors(errors);
      return;
    }

    setSavingNewCustomer(true);
    setNewCustomerErrors({});

    try {
      const payload = {
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim(),
        business_name: newCustomerData.business_name.trim() || null,
        address: newCustomerData.address.trim() || null,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Customer "${payload.name}" created`);
      setCustomers((prev) => [...prev, data]);
      handleSelectCustomer(data);
      setShowInlineCustomerForm(false);
      setNewCustomerData({ name: '', phone: '', business_name: '', address: '' });
    } catch (err) {
      console.error('Error creating customer inline:', err);
      setNewCustomerErrors({ submit: err.message || 'Failed to create customer' });
    } finally {
      setSavingNewCustomer(false);
    }
  };

  // Handle item product change
  const handleProductChange = (index, productId) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...orderItems];
    if (prod) {
      const maxStock = prod.stock_quantity || 0;
      updated[index] = {
        product_id: prod.id,
        quantity: maxStock > 0 ? 1 : 0,
        unit_price: Number(prod.unit_price) || 0,
        stock_quantity: maxStock,
        unit: prod.unit || 'unit',
      };
    } else {
      updated[index] = { product_id: '', quantity: 1, unit_price: 0, stock_quantity: 0, unit: '' };
    }
    setOrderItems(updated);
  };

  // Handle item quantity change
  const handleQuantityChange = (index, value) => {
    const updated = [...orderItems];
    const item = updated[index];
    let qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (item.stock_quantity > 0 && qty > item.stock_quantity) {
      qty = item.stock_quantity;
    }
    updated[index].quantity = qty;
    setOrderItems(updated);
  };

  // Add row
  const handleAddProductRow = () => {
    // Pick first product not already in orderItems, or first available
    const usedIds = new Set(orderItems.map((i) => i.product_id));
    const nextProduct = products.find((p) => !usedIds.has(p.id) && p.stock_quantity > 0) || products[0];

    if (nextProduct) {
      setOrderItems([
        ...orderItems,
        {
          product_id: nextProduct.id,
          quantity: 1,
          unit_price: Number(nextProduct.unit_price) || 0,
          stock_quantity: nextProduct.stock_quantity || 0,
          unit: nextProduct.unit || 'unit',
        },
      ]);
    } else {
      setOrderItems([
        ...orderItems,
        { product_id: '', quantity: 1, unit_price: 0, stock_quantity: 0, unit: '' }
      ]);
    }
  };

  // Remove row
  const handleRemoveProductRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Calculate live grand total
  const liveGrandTotal = orderItems.reduce((sum, item) => {
    if (!item.product_id) return sum;
    return sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
  }, 0);

  // Submit Order to create_order RPC
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');

    if (!selectedCustomerId) {
      setOrderError('Please select a customer or add a new customer.');
      return;
    }

    const cleanItems = orderItems
      .filter((i) => i.product_id && parseInt(i.quantity, 10) > 0)
      .map((i) => ({
        product_id: i.product_id,
        quantity: parseInt(i.quantity, 10),
      }));

    if (cleanItems.length === 0) {
      setOrderError('Please select at least one product with a valid quantity.');
      return;
    }

    setSubmittingOrder(true);

    try {
      const { data: newOrderId, error } = await supabase.rpc('create_order', {
        p_customer_id: selectedCustomerId,
        p_items: cleanItems,
        p_address: deliveryAddress.trim() || null,
        p_notes: orderNotes.trim() || null,
      });

      if (error) throw error;

      toast.success('Order created successfully');
      setIsModalOpen(false);
      fetchOrders();
      fetchProductsAndStock();

      if (newOrderId) {
        navigate(`/orders/${newOrderId}`);
      }
    } catch (err) {
      console.error('Error in create_order RPC:', err);
      // Show error clearly and KEEP THE FORM
      setOrderError(err.message || 'Failed to create order. Please check available stock.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filtered customers for dropdown search
  const filteredCustomerOptions = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.business_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  // Filter orders by active tab and search query
  const filteredOrders = orders.filter((o) => {
    if (activeTab !== 'ALL' && (o.status || '').toLowerCase() !== activeTab.toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = o.order_number?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q);
      const matchCustomer = o.customers?.name?.toLowerCase().includes(q);
      const matchBusiness = o.customers?.business_name?.toLowerCase().includes(q);

      if (!matchOrderNum && !matchCustomer && !matchBusiness) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Orders
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage fulfillment and wholesale deliveries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              fetchOrders();
              fetchProductsAndStock();
            }}
            className="h-10 px-3 text-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenNewOrder}
            className="h-10 px-4 text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New order</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Line with 3 Plain Numbers */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted py-2 px-1">
        <div>
          <span className="font-semibold text-primary">{pendingOrdersCount}</span> pending orders
        </div>
        <span className="text-border select-none">·</span>
        <div>
          <span className="font-semibold text-primary">{ordersPlacedTodayCount}</span> placed today
        </div>
        <span className="text-border select-none">·</span>
        <div>
          <span className={`font-semibold ${lowStockCount > 0 ? 'text-amber-700' : 'text-primary'}`}>
            {lowStockCount}
          </span>{' '}
          products low on stock
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-9 px-3.5 text-xs font-medium border transition-colors shrink-0 ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-muted border-border hover:border-primary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 border border-border rounded-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9F6] text-sm border border-border py-2 pl-9 pr-3 rounded-none focus:outline-none focus:border-primary"
          />
        </div>

        <div className="text-xs text-muted">
          <span>{filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Orders Table (Newest First) */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Loading orders..." />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={searchQuery || activeTab !== 'ALL' ? 'No matching orders' : 'No orders yet'}
          description={
            searchQuery || activeTab !== 'ALL'
              ? 'No orders matched your search criteria.'
              : 'Create your first wholesale order using the "New order" button.'
          }
          actionLabel={searchQuery || activeTab !== 'ALL' ? 'Clear search' : 'New order'}
          onAction={
            searchQuery || activeTab !== 'ALL'
              ? () => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }
              : handleOpenNewOrder
          }
        />
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#F7F9F6] text-xs font-semibold text-muted">
                  <th className="py-3 px-4">Order number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((ord) => {
                  const displayOrderNo = ord.order_number || ord.id.substring(0, 8);
                  const customerName = ord.customers?.name || 'Customer';
                  const businessName = ord.customers?.business_name;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-[#F7F9F6]/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${ord.id}`)}
                    >
                      <td className="py-3.5 px-4 font-semibold text-primary whitespace-nowrap">
                        {displayOrderNo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-primary">
                          {customerName}
                        </div>
                        {businessName && (
                          <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-secondary shrink-0" />
                            <span>{businessName}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-muted whitespace-nowrap">
                        {formatDate(ord.created_at)}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-primary whitespace-nowrap">
                        {formatRWF(ord.total_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={ord.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. NEW ORDER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submittingOrder && setIsModalOpen(false)}
        title="New order"
        subtitle="Create an order and deduct stock atomically"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleOrderSubmit} className="space-y-5">
          {/* Error Banner (keeps the form open on error) */}
          {orderError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md flex items-start justify-between gap-2">
              <span>{orderError}</span>
              <button
                type="button"
                onClick={() => setOrderError('')}
                className="text-red-500 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Customer Selection with Searchable Dropdown & Inline Add Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted">
                Customer *
              </label>
              {!showInlineCustomerForm && (
                <button
                  type="button"
                  onClick={() => setShowInlineCustomerForm(true)}
                  className="text-xs text-secondary hover:text-primary font-medium inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add new customer</span>
                </button>
              )}
            </div>

            {/* Inline Customer Form */}
            {showInlineCustomerForm ? (
              <div className="p-4 bg-[#F7F9F6] border border-border rounded-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/80">
                  <span className="text-xs font-semibold text-primary">New customer details</span>
                  <button
                    type="button"
                    onClick={() => setShowInlineCustomerForm(false)}
                    className="text-xs text-muted hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>

                {newCustomerErrors.submit && (
                  <p className="text-xs text-error font-medium">{newCustomerErrors.submit}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Contact name *"
                    placeholder="e.g. Jean Paul"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    error={newCustomerErrors.name}
                    autoFocus
                  />
                  <Input
                    label="Phone number *"
                    type="tel"
                    placeholder="e.g. +250 788 123 456"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    error={newCustomerErrors.phone}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Business name (optional)"
                    placeholder="e.g. Supermarket Kigali"
                    value={newCustomerData.business_name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, business_name: e.target.value })}
                  />
                  <Input
                    label="Delivery address (optional)"
                    placeholder="e.g. KN 4 Ave, Kigali"
                    value={newCustomerData.address}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveInlineCustomer}
                    loading={savingNewCustomer}
                    className="h-9 px-3 text-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Save customer & select</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Searchable Customer Dropdown */
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search or select a customer..."
                    value={customerSearch}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                      setSelectedCustomerId('');
                    }}
                    className="w-full bg-surface text-sm border border-[#D7DDD6] py-2.5 pl-9 pr-8 focus:outline-none focus:border-primary"
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearch('');
                        setSelectedCustomerId('');
                        setDeliveryAddress('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto bg-surface border border-border shadow-lg">
                    {filteredCustomerOptions.length === 0 ? (
                      <div className="p-3 text-xs text-muted text-center">
                        <span>No customers match "{customerSearch}".</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomerDropdownOpen(false);
                            setShowInlineCustomerForm(true);
                            setNewCustomerData((prev) => ({ ...prev, name: customerSearch }));
                          }}
                          className="block mx-auto mt-1 text-secondary font-medium underline"
                        >
                          Add as new customer
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {filteredCustomerOptions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[#F7F9F6] transition-colors flex items-center justify-between ${
                              selectedCustomerId === c.id ? 'bg-[#F7F9F6] font-semibold' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium text-primary">
                                {c.name} {c.business_name && <span className="text-muted font-normal">({c.business_name})</span>}
                              </div>
                              <div className="text-[11px] text-muted">
                                Phone: {c.phone || '—'} {c.address && `· Address: ${c.address}`}
                              </div>
                            </div>
                            {selectedCustomerId === c.id && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delivery Address (prefilled from customer, editable) */}
          <Input
            label="Delivery address"
            name="deliveryAddress"
            placeholder="e.g. Nyarugenge Market, Shop #12"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />

          {/* Product Rows */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">
                Order products *
              </span>
              <button
                type="button"
                onClick={handleAddProductRow}
                className="text-xs font-semibold text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add product row</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {orderItems.map((item, index) => {
                const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
                const selectedProd = products.find((p) => p.id === item.product_id);
                const isOutOfStock = selectedProd && selectedProd.stock_quantity <= 0;

                return (
                  <div
                    key={index}
                    className="p-3 bg-[#F7F9F6] border border-border rounded-md grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                  >
                    {/* Product Dropdown */}
                    <div className="sm:col-span-5">
                      <label className="text-[11px] text-muted block mb-1 font-medium sm:hidden">
                        Product
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full bg-surface text-xs border border-border p-2 focus:outline-none focus:border-primary"
                        required
                      >
                        <option value="">— Select a product —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                            {p.name} ({formatRWF(p.unit_price)}) — {p.stock_quantity > 0 ? `${p.stock_quantity} available` : 'Out of stock'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2 text-center sm:text-left">
                      <span className="text-[11px] text-muted block sm:hidden">Unit price:</span>
                      <span className="text-muted font-medium">
                        {item.product_id ? formatRWF(item.unit_price) : '—'}
                      </span>
                    </div>

                    {/* Quantity (Limited to available stock) */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-muted block mb-1 font-medium sm:hidden">
                        Quantity (max {item.stock_quantity}):
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max={item.stock_quantity > 0 ? item.stock_quantity : 1}
                          disabled={isOutOfStock}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-full bg-surface text-xs border border-border p-2 focus:outline-none focus:border-primary text-center"
                          required
                        />
                      </div>
                      {item.stock_quantity > 0 && (
                        <span className="text-[10px] text-muted block mt-0.5 text-center">
                          Max: {item.stock_quantity}
                        </span>
                      )}
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 text-right">
                      <span className="text-[11px] text-muted block sm:hidden">Line total:</span>
                      <span className="font-semibold text-primary">
                        {item.product_id ? formatRWF(lineTotal) : '0 RWF'}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(index)}
                        disabled={orderItems.length === 1}
                        className="p-1.5 text-muted hover:text-error disabled:opacity-20 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Grand Total */}
            <div className="p-3 bg-[#F7F9F6] border border-border rounded-md flex items-center justify-between text-sm">
              <span className="font-medium text-muted">Grand total:</span>
              <span className="text-lg font-bold text-primary">
                {formatRWF(liveGrandTotal)}
              </span>
            </div>
          </div>

          {/* Notes (Optional) */}
          <Input
            label="Notes (optional)"
            name="notes"
            placeholder="e.g. Call before dispatch, unload at Gate 2"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />

          {/* Modal Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submittingOrder}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submittingOrder}
            >
              <span>Place order ({formatRWF(liveGrandTotal)})</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
