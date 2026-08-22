import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

type OrderWithItems = Order & {
  order_items?: {
    id: string;
    quantity: number;
    price: number;
    products?: {
      name: string;
      image_url: string | null;
    };
  }[];
};

type StoreSettings = {
  store_name?: string;
  phone?: string;
  whatsapp_number?: string;
};

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [orderIdInput, setOrderIdInput] = useState(initialId);
  const [phoneInput, setPhoneInput] = useState('');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({});

  // Fetch store settings for support contact
  useEffect(() => {
    supabase
      .from('settings')
      .select('store_name, phone, whatsapp_number')
      .single()
      .then(({ data }) => {
        if (data) setStoreSettings(data);
      });
  }, []);

  // Perform search
  const handleTrack = async (searchId?: string, searchPhone?: string) => {
    const rawId = (searchId !== undefined ? searchId : orderIdInput).trim().replace(/^#/, '');
    const phone = (searchPhone !== undefined ? searchPhone : phoneInput).trim();

    if (!rawId && !phone) {
      setError('Please enter your Order ID or registered Phone Number.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_url
            )
          )
        `);

      if (rawId) {
        // If 36-char full UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)) {
          query = query.eq('id', rawId);
        } else {
          // Allow tracking with 8-character prefix or partial ID
          query = query.ilike('id', `${rawId}%`);
        }
      }

      if (phone) {
        query = query.eq('phone', phone);
      }

      const { data, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        const foundOrder = data[0] as OrderWithItems;
        setOrder(foundOrder);
        // Save last tracked id to localStorage for convenience
        try {
          localStorage.setItem('last_tracked_order_id', foundOrder.id);
        } catch {
          // ignore
        }
      } else {
        setOrder(null);
        setError('No order found matching your search. Please verify your Order ID or phone number.');
      }
    } catch (err: any) {
      console.error('Tracking query error:', err);
      setError('Unable to fetch tracking info. Please check your connection and try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if query param is present on initial load
  useEffect(() => {
    if (initialId) {
      handleTrack(initialId);
    } else {
      // Check if localStorage has a recent order ID
      try {
        const savedId = localStorage.getItem('last_tracked_order_id');
        if (savedId && !hasSearched) {
          setOrderIdInput(savedId.slice(0, 8).toUpperCase());
        }
      } catch {
        // ignore
      }
    }
  }, [initialId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setSearchParams({ id: orderIdInput.trim().replace(/^#/, '') });
    }
    handleTrack();
  };

  const handleCopyId = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tracking Timeline steps
  const steps = [
    {
      id: 'Pending',
      title: 'Order Placed',
      desc: 'Order received & awaiting confirmation',
      icon: Clock,
    },
    {
      id: 'Confirmed',
      title: 'Order Confirmed',
      desc: 'Verified & packing items',
      icon: CheckCircle2,
    },
    {
      id: 'Shipped',
      title: 'Out for Delivery',
      desc: 'Courier/delivery agent in transit',
      icon: Truck,
    },
    {
      id: 'Delivered',
      title: 'Delivered',
      desc: 'Package handed over successfully',
      icon: Package,
    },
  ];

  const getStepStatus = (stepId: string, currentStatus: string) => {
    if (currentStatus === 'Cancelled') return 'cancelled';
    const orderIndexMap: Record<string, number> = {
      Pending: 0,
      Confirmed: 1,
      Shipped: 2,
      Delivered: 3,
    };
    const currentIdx = orderIndexMap[currentStatus] ?? 0;
    const stepIdx = orderIndexMap[stepId] ?? 0;

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  const shortId = order ? order.id.slice(0, 8).toUpperCase() : '';

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      {/* Top Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-3 shadow-xs">
          <Truck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Order
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Enter your Order ID (with or without account) to check live shipping status and order progress.
        </p>
      </div>

      {/* Tracking Search Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs mb-8">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Order ID / Reference #
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 8A3F12BC or full UUID"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium"
                />
                <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">
              Tip: You can find your Order ID in your checkout confirmation or SMS/email.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-start gap-3 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Order Not Found</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Order Results */}
      {order && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Order Header Badge Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg font-bold text-blue-600">#{shortId}</span>
                  <button
                    onClick={() => handleCopyId(order.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Copy full Order UUID"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Amount</span>
                <span className="text-2xl font-bold text-slate-900">
                  ₹{Number(order.total_amount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 block font-medium">({order.payment_method})</span>
              </div>
            </div>

            {/* Cancelled Banner if cancelled */}
            {order.status === 'Cancelled' ? (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Order Cancelled</div>
                  <div className="text-xs text-red-600 mt-0.5">
                    This order was cancelled. Please contact support if you need further assistance.
                  </div>
                </div>
              </div>
            ) : (
              /* Visual Timeline Progress */
              <div className="mt-8">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative z-10">
                    {steps.map((step) => {
                      const state = getStepStatus(step.id, order.status);
                      const StepIcon = step.icon;

                      return (
                        <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                              state === 'completed'
                                ? 'bg-green-600 border-green-600 text-white shadow-xs'
                                : state === 'current'
                                ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                                : 'bg-white border-slate-200 text-slate-300'
                            }`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>

                          <div>
                            <div
                              className={`text-xs font-bold ${
                                state === 'completed'
                                  ? 'text-green-700'
                                  : state === 'current'
                                  ? 'text-blue-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </div>
                            <div className="text-[11px] text-slate-500 sm:max-w-[130px] sm:mx-auto">
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Items Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Info */}
            <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Delivery Details
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Recipient:</span>
                  <span className="font-semibold text-slate-900 text-sm">{order.customer_name}</span>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{order.phone}</span>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {order.address}, {order.city} - {order.pin_code}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-slate-700">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Payment: <strong>{order.payment_method}</strong></span>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Ordered Items ({order.order_items?.length || 0})
              </h3>

              <div className="space-y-3">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {item.products?.image_url ? (
                          <img
                            src={item.products.image_url}
                            alt={item.products?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm truncate">
                          {item.products?.name || 'Product'}
                        </div>
                        <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                      </div>

                      <div className="font-bold text-slate-900 text-sm">
                        ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No item details available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Need Assistance Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Need help with this order?</div>
                <div className="text-xs text-slate-600">
                  Contact {storeSettings.store_name || 'our support team'} directly for delivery questions.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {storeSettings.whatsapp_number && (
                <a
                  href={`https://wa.me/${storeSettings.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi, I need help with my Order #${shortId}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
              {storeSettings.phone && (
                <a
                  href={`tel:${storeSettings.phone}`}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call Us</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Help & FAQ section if no search yet */}
      {!order && !hasSearched && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-slate-600 text-xs space-y-3">
          <div className="font-bold text-slate-900 text-sm">How do I find my Order ID?</div>
          <p>
            When you complete an order on {storeSettings.store_name || 'our store'}, an 8-character reference code (e.g. <code>#4F9A1B2C</code>) is generated on your checkout receipt. You can also view all your past orders anytime if you have an account under <Link to="/my-orders" className="text-blue-600 font-semibold hover:underline">My Orders</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
