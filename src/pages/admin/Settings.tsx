import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings as SettingsType } from '../../types';
import { Save, Store, Phone, MapPin, MessageSquare, CreditCard, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

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
    delivery_charges: 50,
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
  }, []);

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

      const { error: upsertErr } = await supabase.from('settings').upsert(payload);
      if (upsertErr) throw upsertErr;

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
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage contact information, UPI details, and delivery pricing</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Store settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
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
              UPI VPA ID (For Payments)
            </label>
            <input
              type="text"
              value={form.upi_id}
              onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
              placeholder="store@upi"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
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
              placeholder="50"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
