import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings as SettingsType, PaymentMethod } from '../../types';
import { getStorePaymentMethods, saveStorePaymentMethods, saveStoredStoreName } from '../../lib/utils';
import {
  Save,
  Store,
  Phone,
  MapPin,
  MessageSquare,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Banknote,
  QrCode,
  Wallet,
} from 'lucide-react';

export default function SettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SettingsType>({
    id: '1',
    store_name: 'JKmart 99',
    phone: '',
    address: '',
    whatsapp_number: '',
    upi_id: '',
    delivery_charges: 0,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [newMethodForm, setNewMethodForm] = useState({
    name: '',
    description: '',
    instructions: '',
    type: 'CUSTOM' as const,
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error: fetchErr } = await supabase.from('settings').select('*').single();
        if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;
        if (data) {
          setForm(data as SettingsType);
        }
      } catch (err: any) {
        console.error('Error loading store settings:', err);
        setError(err.message || 'Failed to load store settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
    setPaymentMethods(getStorePaymentMethods());
  }, []);

  const handleToggleMethod = (methodId: string) => {
    setPaymentMethods((prev) => {
      const updated = prev.map((m) =>
        m.id === methodId ? { ...m, enabled: !m.enabled } : m
      );
      saveStorePaymentMethods(updated);
      return updated;
    });
  };

  const handleDeleteMethod = (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    setPaymentMethods((prev) => {
      const updated = prev.filter((m) => m.id !== methodId);
      saveStorePaymentMethods(updated);
      return updated;
    });
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodForm.name.trim()) return;

    const newMethod: PaymentMethod = {
      id: 'CUSTOM_' + Date.now(),
      name: newMethodForm.name.trim(),
      description: newMethodForm.description.trim() || 'Custom payment method',
      instructions: newMethodForm.instructions.trim() || undefined,
      enabled: true,
      type: 'CUSTOM',
    };

    const updated = [...paymentMethods, newMethod];
    setPaymentMethods(updated);
    saveStorePaymentMethods(updated);
    setNewMethodForm({ name: '', description: '', instructions: '', type: 'CUSTOM' });
    setShowAddMethodModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        id: 1,
        store_name: form.store_name,
        phone: form.phone || '',
        address: form.address || '',
        whatsapp_number: form.whatsapp_number || '',
        upi_id: form.upi_id || '',
        delivery_charges: Number(form.delivery_charges),
      };

      const { error: updateErr } = await supabase.from('settings').update(payload).eq('id', 1);
      if (updateErr) {
        const { error: upsertErr } = await supabase.from('settings').upsert(payload);
        if (upsertErr) throw upsertErr;
      }

      saveStoredStoreName(form.store_name);
      saveStorePaymentMethods(paymentMethods);

      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: payload }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save store settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Store & Payment Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your store information, delivery charges, and customer payment methods
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Payment Methods Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Methods
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enable, disable, or add payment options that customers can choose at checkout
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMethodModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </button>
        </div>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const isCOD = method.type === 'COD' || method.id === 'COD';
            const isUPI = method.type === 'UPI' || method.id === 'UPI';

            return (
              <div
                key={method.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                  method.enabled
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-slate-100/40 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3 mb-3 sm:mb-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCOD
                        ? 'bg-emerald-100 text-emerald-700'
                        : isUPI
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {isCOD ? (
                      <Banknote className="w-5 h-5" />
                    ) : isUPI ? (
                      <QrCode className="w-5 h-5" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{method.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          method.enabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {method.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{method.description}</p>
                    {method.instructions && (
                      <p className="text-[11px] text-blue-600 font-medium mt-1">
                        Note: {method.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={() => handleToggleMethod(method.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>

                  {/* Delete Button for custom methods */}
                  {method.type === 'CUSTOM' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete payment method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-600" />
          Store Profile & UPI
        </h2>

        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-400" />
            Store Name
          </label>
          <input
            type="text"
            required
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Contact Phone & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Phone Number
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Store Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Store Address
          </label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Shop No. 12, Main Market, City..."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
          />
        </div>

        {/* Payment & Shipping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              UPI VPA ID (For QR Payments)
            </label>
            <input
              type="text"
              value={form.upi_id}
              onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
              placeholder="e.g. 9876543210@paytm or store@okhdfcbank"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Used automatically for customer UPI QR generation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" />
              Standard Delivery Charges (₹)
            </label>
            <input
              type="number"
              required
              value={form.delivery_charges}
              onChange={(e) => setForm({ ...form, delivery_charges: Number(e.target.value) })}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Set to 0 for Free Delivery</p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-sm text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* Add Custom Payment Method Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddMethodModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Add New Payment Method</h3>
              </div>
              <button
                onClick={() => setShowAddMethodModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMethodForm.name}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, name: e.target.value })}
                  placeholder="e.g., Direct Bank Transfer / NEFT"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newMethodForm.description}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, description: e.target.value })}
                  placeholder="e.g., Transfer directly to our bank account"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newMethodForm.instructions}
                  onChange={(e) => setNewMethodForm({ ...newMethodForm, instructions: e.target.value })}
                  placeholder="e.g., A/C: 1234567890, IFSC: HDFC0001234, Bank: HDFC Bank"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMethodModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  Add Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
