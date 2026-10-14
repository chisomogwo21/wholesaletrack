import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      toast.error(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setModalMode('edit');
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Supplier name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
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
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
      };

      if (modalMode === 'add') {
        const { error } = await supabase.from('suppliers').insert([payload]);
        if (error) throw error;
        toast.success(`Supplier "${payload.name}" added`);
      } else {
        const { error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success(`Supplier "${payload.name}" updated`);
      }

      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error('Save supplier error:', err);
      toast.error(err.message || 'Failed to save supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id);

      if (error) {
        if (error.code === '23503' || error.message?.includes('foreign key')) {
          toast.error(`Cannot delete "${supplier.name}" because it is linked to existing products or stock records.`);
        } else {
          toast.error(error.message || 'Failed to delete supplier');
        }
        return;
      }

      toast.success(`Supplier "${supplier.name}" deleted`);
      setDeleteConfirm(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Delete supplier error:', err);
      toast.error('Unexpected error while deleting supplier');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Suppliers
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage your suppliers and vendor contact information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchSuppliers}
            className="h-10 px-3 text-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="primary" onClick={handleOpenAdd} className="h-10 px-4 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add supplier</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 border border-border rounded-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9F6] text-sm border border-border py-2 pl-9 pr-3 rounded-none focus:outline-none focus:border-primary"
          />
        </div>

        <div className="text-xs text-muted">
          <span>{filteredSuppliers.length} supplier{filteredSuppliers.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" label="Loading suppliers..." />
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? 'No matching suppliers' : 'No suppliers registered'}
          description={
            searchQuery
              ? `No suppliers matched "${searchQuery}". Clear your search to see all records.`
              : 'Add your first supplier to link products and intake shipments.'
          }
          actionLabel={searchQuery ? 'Clear search' : 'Add supplier'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenAdd}
        />
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#F7F9F6] text-xs font-semibold text-muted">
                  <th className="py-3 px-4">Supplier name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7F9F6]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-primary">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      {s.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted" />
                          <span>{s.phone}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      {s.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted" />
                          <span>{s.email}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted">
                      {s.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted" />
                          <span>{s.address}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 px-2.5 bg-surface hover:bg-[#F7F9F6] text-primary border border-border text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Edit supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(s)}
                          className="h-8 px-2.5 bg-transparent hover:bg-error/10 text-error border border-border hover:border-error text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Delete supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
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
        title={modalMode === 'add' ? 'Add supplier' : 'Edit supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier name"
            name="name"
            placeholder="e.g. Kigali Provisions Ltd"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
            autoFocus
          />

          <Input
            label="Phone number"
            name="phone"
            type="tel"
            icon={Phone}
            placeholder="e.g. +250 788 123 456"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="e.g. contact@kigaliprovisions.rw"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />

          <Input
            label="Address"
            name="address"
            icon={MapPin}
            placeholder="e.g. Nyarugenge District, Kigali"
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
              {modalMode === 'add' ? 'Add supplier' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Delete supplier"
      >
        <div className="space-y-4">
          <p className="text-sm text-primary">
            Are you sure you want to delete supplier <strong>{deleteConfirm?.name}</strong>?
          </p>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
