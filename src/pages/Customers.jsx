import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Users,
  Plus,
  Search,
  Phone,
  Store,
  MapPin,
  Edit2,
  RefreshCw,
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    business_name: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({ name: '', phone: '', business_name: '', address: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setModalMode('edit');
    setEditingId(customer.id);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      business_name: customer.business_name || '',
      address: customer.address || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Contact name is required';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        business_name: formData.business_name.trim() || null,
        address: formData.address.trim() || null,
      };

      if (modalMode === 'add') {
        const { error } = await supabase.from('customers').insert([payload]);
        if (error) throw error;
        toast.success(`Customer "${payload.name}" added`);
      } else {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success(`Customer "${payload.name}" updated`);
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Save customer error:', err);
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.business_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Customers
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your wholesale customer accounts and contact details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchCustomers}
            className="h-10 px-3 text-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="primary" onClick={handleOpenAdd} className="h-10 px-4 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add customer</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 border border-border rounded-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, business, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9F6] text-sm border border-border py-2 pl-9 pr-3 rounded-none focus:outline-none focus:border-primary"
          />
        </div>

        <div className="text-xs text-muted">
          <span>{filteredCustomers.length} customer{filteredCustomers.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Loading customers..." />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No matching customers' : 'No customers yet'}
          description={
            searchQuery
              ? `No customers matched "${searchQuery}". Clear your search to see all records.`
              : 'Add your first customer to assign wholesale orders.'
          }
          actionLabel={searchQuery ? 'Clear search' : 'Add customer'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenAdd}
        />
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#F7F9F6] text-xs font-semibold text-muted">
                  <th className="py-3 px-4">Contact name</th>
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F9F6]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-primary">
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      {c.business_name ? (
                        <div className="flex items-center gap-1.5 font-medium text-primary">
                          <Store className="w-3.5 h-3.5 text-secondary" />
                          <span>{c.business_name}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted max-w-xs truncate">
                      {c.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="h-8 px-2.5 bg-surface hover:bg-[#F7F9F6] text-primary border border-border text-xs font-medium inline-flex items-center gap-1 transition-colors rounded-none"
                        title="Edit customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add customer' : 'Edit customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Contact name"
            name="name"
            placeholder="e.g. Jean Paul"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
            autoFocus
          />

          <Input
            label="Business name (optional)"
            name="business_name"
            placeholder="e.g. Nyarugenge Supermarket"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
          />

          <Input
            label="Phone number"
            name="phone"
            type="tel"
            icon={Phone}
            placeholder="e.g. +250 788 123 456"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            required
          />

          <Input
            label="Address"
            name="address"
            icon={MapPin}
            placeholder="e.g. Kigali, KN 4 Ave"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
            >
              {modalMode === 'add' ? 'Add customer' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
