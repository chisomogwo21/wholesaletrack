import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { formatRWF, formatDate } from '../utils/format';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  RefreshCw,
  Building2,
  History,
  Layers,
} from 'lucide-react';

export default function Products() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'history'
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Catalog filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'ACTIVE' | 'INACTIVE'

  // Add/Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState('add'); // 'add' | 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'box',
    unit_price: '',
    reorder_level: 10,
    supplier_id: '',
  });
  const [productErrors, setProductErrors] = useState({});
  const [savingProduct, setSavingProduct] = useState(false);

  // Receive Stock Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingProduct, setReceivingProduct] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    quantity: '',
    supplier_id: '',
    note: '',
  });
  const [receiveErrors, setReceiveErrors] = useState({});
  const [receivingStock, setReceivingStock] = useState(false);

  // Stock History State
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL');
  const [movementProductFilter, setMovementProductFilter] = useState('ALL');

  const toast = useToast();

  const fetchSuppliers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.warn('Error loading suppliers:', err.message);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category,
          unit,
          unit_price,
          stock_quantity,
          reorder_level,
          supplier_id,
          is_active,
          suppliers (
            id,
            name
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          product_id,
          type,
          quantity,
          supplier_id,
          order_id,
          note,
          created_at,
          products (
            id,
            name,
            sku,
            unit
          ),
          suppliers (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      toast.error(err.message || 'Failed to load stock history');
    } finally {
      setLoadingMovements(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts, fetchSuppliers]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  // Open Add Product
  const handleOpenAddProduct = () => {
    setProductModalMode('add');
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: '',
      unit: 'box',
      unit_price: '',
      reorder_level: 10,
      supplier_id: suppliers[0]?.id || '',
    });
    setProductErrors({});
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (p) => {
    setProductModalMode('edit');
    setEditingProduct(p);
    setProductForm({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || '',
      unit: p.unit || 'unit',
      unit_price: p.unit_price ?? '',
      reorder_level: p.reorder_level ?? 10,
      supplier_id: p.supplier_id || '',
    });
    setProductErrors({});
    setIsProductModalOpen(true);
  };

  // Validate Add/Edit Form
  const validateProductForm = () => {
    const errors = {};
    if (!productForm.name.trim()) errors.name = 'Product name is required';
    if (!productForm.sku.trim()) errors.sku = 'SKU is required';
    if (!productForm.category.trim()) errors.category = 'Category is required';
    if (!productForm.unit.trim()) errors.unit = 'Unit is required';

    const price = parseFloat(productForm.unit_price);
    if (isNaN(price) || price < 0) {
      errors.unit_price = 'Price must be a valid number';
    }

    const reorder = parseInt(productForm.reorder_level, 10);
    if (isNaN(reorder) || reorder < 0) {
      errors.reorder_level = 'Reorder level must be 0 or higher';
    }

    setProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add / Edit
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim().toUpperCase(),
        category: productForm.category.trim(),
        unit: productForm.unit.trim(),
        unit_price: parseFloat(productForm.unit_price),
        reorder_level: parseInt(productForm.reorder_level, 10),
        supplier_id: productForm.supplier_id || null,
      };

      if (productModalMode === 'add') {
        payload.stock_quantity = 0;
        payload.is_active = true;

        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        toast.success(`Product "${payload.name}" added`);
      } else {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success(`Product "${payload.name}" updated`);
      }

      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (p) => {
    const nextState = !p.is_active;
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: nextState })
        .eq('id', p.id);

      if (error) throw error;

      toast.success(
        `"${p.name}" marked as ${nextState ? 'Active' : 'Inactive'}`
      );
      fetchProducts();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Open Receive Stock Modal
  const handleOpenReceive = (p) => {
    setReceivingProduct(p);
    setReceiveForm({
      quantity: '',
      supplier_id: p.supplier_id || suppliers[0]?.id || '',
      note: '',
    });
    setReceiveErrors({});
    setIsReceiveModalOpen(true);
  };

  // Submit Receive Stock RPC
  const handleSubmitReceive = async (e) => {
    e.preventDefault();
    const qty = parseInt(receiveForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setReceiveErrors({ quantity: 'Quantity must be at least 1' });
      return;
    }

    setReceivingStock(true);
    try {
      const { error } = await supabase.rpc('receive_stock', {
        p_product_id: receivingProduct.id,
        p_quantity: qty,
        p_supplier_id: receiveForm.supplier_id || null,
        p_note: receiveForm.note.trim() || null,
      });

      if (error) throw error;

      toast.success(`Added ${qty} ${receivingProduct.unit} to stock`);
      setIsReceiveModalOpen(false);
      fetchProducts();
      if (activeTab === 'history') {
        fetchMovements();
      }
    } catch (err) {
      console.error('Receive stock error:', err);
      toast.error(err.message || 'Failed to receive stock');
    } finally {
      setReceivingStock(false);
    }
  };

  // Category options
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.suppliers?.name?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = p.stock_quantity <= p.reorder_level;
    } else if (stockFilter === 'ACTIVE') {
      matchesStock = p.is_active === true;
    } else if (stockFilter === 'INACTIVE') {
      matchesStock = p.is_active === false;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Filtering stock movements
  const filteredMovements = movements.filter((m) => {
    if (movementTypeFilter !== 'ALL' && m.type?.toLowerCase() !== movementTypeFilter.toLowerCase()) {
      return false;
    }
    if (movementProductFilter !== 'ALL' && m.product_id !== movementProductFilter) {
      return false;
    }
    if (movementSearch.trim()) {
      const q = movementSearch.toLowerCase();
      const matchNote = m.note?.toLowerCase().includes(q);
      const matchName = m.products?.name?.toLowerCase().includes(q);
      const matchSku = m.products?.sku?.toLowerCase().includes(q);
      const matchSupplier = m.suppliers?.name?.toLowerCase().includes(q);
      if (!matchNote && !matchName && !matchSku && !matchSupplier) {
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
            Products
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your inventory items, pricing, and stock history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={activeTab === 'catalog' ? fetchProducts : fetchMovements}
            className="h-10 px-3 text-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || loadingMovements ? 'animate-spin' : ''}`} />
          </Button>

          {activeTab === 'catalog' && (
            <Button
              variant="primary"
              onClick={handleOpenAddProduct}
              className="h-10 px-4 text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock history</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-surface p-4 border border-border rounded-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F7F9F6] text-sm border border-border py-2 pl-9 pr-3 rounded-none focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#F7F9F6] text-xs border border-border px-2.5 py-1.5 focus:outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'ALL' ? 'All categories' : c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'LOW', label: 'Low stock' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'INACTIVE', label: 'Inactive' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStockFilter(f.id)}
                    className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                      stockFilter === f.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-muted border-border hover:border-primary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Catalog Table */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" label="Loading products..." />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' ? 'No matching products' : 'No products yet'}
              description={
                searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                  ? 'No products matched your filters. Try clearing your search.'
                  : 'Get started by adding your first product to the catalog.'
              }
              actionLabel={searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' ? 'Clear filters' : 'Add product'}
              onAction={
                searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL'
                  ? () => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setStockFilter('ALL');
                    }
                  : handleOpenAddProduct
              }
            />
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#F7F9F6] text-xs font-semibold text-muted">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.stock_quantity <= p.reorder_level;
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-[#F7F9F6]/50 transition-colors ${
                            !p.is_active ? 'opacity-60 bg-neutral/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-semibold text-primary">
                            {p.name}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono text-muted">
                            {p.sku}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted">
                            {p.category}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted">
                            {p.unit}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-primary whitespace-nowrap">
                            {formatRWF(p.unit_price)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isLowStock ? 'text-error' : 'text-primary'}`}>
                                {p.stock_quantity}
                              </span>
                              {isLowStock && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-error/10 text-error px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Low stock</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted block mt-0.5">
                              Reorder at {p.reorder_level}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted">
                            {p.suppliers?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(p)}
                              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium transition-colors ${
                                p.is_active
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-neutral/40 text-muted border-border hover:bg-neutral/60'
                              }`}
                              title="Click to toggle status"
                            >
                              {p.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenReceive(p)}
                                className="h-8 px-2.5 bg-accent text-primary border border-accent hover:brightness-95 text-xs font-semibold flex items-center gap-1 transition-all"
                                title="Receive stock intake"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span>Receive</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="h-8 px-2.5 bg-surface hover:bg-[#F7F9F6] text-primary border border-border text-xs font-medium flex items-center gap-1 transition-colors"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STOCK HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Filters */}
          <div className="bg-surface p-4 border border-border rounded-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history by note, product, or supplier..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="w-full bg-[#F7F9F6] text-sm border border-border py-2 pl-9 pr-3 rounded-none focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Product:</span>
                <select
                  value={movementProductFilter}
                  onChange={(e) => setMovementProductFilter(e.target.value)}
                  className="bg-[#F7F9F6] text-xs border border-border px-2.5 py-1.5 focus:outline-none focus:border-primary max-w-[200px]"
                >
                  <option value="ALL">All products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'in', label: 'Intake (In)' },
                  { id: 'out', label: 'Fulfillment (Out)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setMovementTypeFilter(t.id)}
                    className={`px-2.5 py-1 text-xs font-medium border transition-colors ${
                      movementTypeFilter === t.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-muted border-border hover:border-primary'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Table */}
          {loadingMovements ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" label="Loading stock history..." />
            </div>
          ) : filteredMovements.length === 0 ? (
            <EmptyState
              icon={History}
              title={movementSearch || movementTypeFilter !== 'ALL' || movementProductFilter !== 'ALL' ? 'No matching stock movements' : 'No stock history yet'}
              description={
                movementSearch || movementTypeFilter !== 'ALL' || movementProductFilter !== 'ALL'
                  ? 'No records match your filters.'
                  : 'Stock movements are recorded automatically when you receive stock or complete orders.'
              }
              actionLabel={movementSearch || movementTypeFilter !== 'ALL' || movementProductFilter !== 'ALL' ? 'Clear filters' : undefined}
              onAction={() => {
                setMovementSearch('');
                setMovementTypeFilter('ALL');
                setMovementProductFilter('ALL');
              }}
            />
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#F7F9F6] text-xs font-semibold text-muted">
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Note / Order</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMovements.map((m) => {
                      const isIn = m.type?.toLowerCase() === 'in';
                      return (
                        <tr key={m.id} className="hover:bg-[#F7F9F6]/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                                isIn
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {isIn ? (
                                <>
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                                  <span>In</span>
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight className="w-3 h-3 text-amber-700" />
                                  <span>Out</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-primary">
                              {m.products?.name || 'Unknown product'}
                            </div>
                            <div className="text-xs text-muted font-mono">
                              {m.products?.sku}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold">
                            <span className={isIn ? 'text-emerald-700' : 'text-primary'}>
                              {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                            </span>{' '}
                            <span className="text-xs text-muted font-normal">
                              {m.products?.unit || 'units'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted">
                            {m.suppliers?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted max-w-xs">
                            {m.note || (m.order_id ? `Order ref: ${m.order_id.slice(0, 8)}` : '—')}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted text-right whitespace-nowrap">
                            {formatDate(m.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => !savingProduct && setIsProductModalOpen(false)}
        title={productModalMode === 'add' ? 'Add product' : 'Edit product'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          <Input
            label="Product name"
            name="name"
            placeholder="e.g. Jasmine Rice 25kg"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            error={productErrors.name}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU"
              name="sku"
              placeholder="e.g. RIC-025"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              error={productErrors.sku}
              required
            />

            <Input
              label="Category"
              name="category"
              placeholder="e.g. Grains & Cereals"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              error={productErrors.category}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Unit"
              name="unit"
              placeholder="e.g. box, bag, kg"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
              error={productErrors.unit}
              required
            />

            <Input
              label="Price (RWF)"
              name="unit_price"
              type="number"
              min="0"
              step="any"
              placeholder="38000"
              value={productForm.unit_price}
              onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })}
              error={productErrors.unit_price}
              required
            />

            <Input
              label="Reorder level"
              name="reorder_level"
              type="number"
              min="0"
              step="1"
              placeholder="10"
              value={productForm.reorder_level}
              onChange={(e) => setProductForm({ ...productForm, reorder_level: e.target.value })}
              error={productErrors.reorder_level}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted">
              Primary supplier (optional)
            </label>
            <select
              value={productForm.supplier_id}
              onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}
              className="w-full bg-surface text-sm border border-[#D7DDD6] py-2.5 px-3 focus:outline-none focus:border-primary"
            >
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              disabled={savingProduct}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={savingProduct}
            >
              {productModalMode === 'add' ? 'Add product' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receive Stock Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => !receivingStock && setIsReceiveModalOpen(false)}
        title="Receive stock"
        subtitle={receivingProduct ? `Add inventory for ${receivingProduct.name}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitReceive} className="space-y-4">
          <div className="p-3 bg-[#F7F9F6] border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted">SKU:</span>
              <span className="font-mono font-medium text-primary">{receivingProduct?.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Current stock:</span>
              <span className="font-semibold text-primary">
                {receivingProduct?.stock_quantity} {receivingProduct?.unit}
              </span>
            </div>
          </div>

          <Input
            label="Quantity to receive"
            name="quantity"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 25"
            value={receiveForm.quantity}
            onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
            error={receiveErrors.quantity}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted">
              Supplier (optional)
            </label>
            <select
              value={receiveForm.supplier_id}
              onChange={(e) => setReceiveForm({ ...receiveForm, supplier_id: e.target.value })}
              className="w-full bg-surface text-sm border border-[#D7DDD6] py-2.5 px-3 focus:outline-none focus:border-primary"
            >
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Note or reference (optional)"
            name="note"
            placeholder="e.g. Delivery note #5421"
            value={receiveForm.note}
            onChange={(e) => setReceiveForm({ ...receiveForm, note: e.target.value })}
          />

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsReceiveModalOpen(false)}
              disabled={receivingStock}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={receivingStock}
            >
              <span>Add to stock</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
