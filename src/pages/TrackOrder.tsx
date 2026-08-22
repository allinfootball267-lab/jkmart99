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
  ChevronRight,
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
  const initialQuery = searchParams.get('id') || searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [ordersList, setOrdersList] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
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

  // Search logic supporting both RPC and Direct Supabase fallback
  const handleTrack = async (queryToSearch?: string) => {
    const rawQuery = (queryToSearch !== undefined ? queryToSearch : searchInput).trim();
    const cleanTerm = rawQuery.replace(/^#/, '').trim();

    if (!cleanTerm) {
      setError('Please enter your Order ID (e.g. #A1B2C3D4) or registered Mobile Number.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setOrdersList([]);
    setSelectedOrder(null);

    try {
      let matchedOrders: OrderWithItems[] = [];

      // 1. Try RPC 'track_order' first
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('track_order', {
          p_query: cleanTerm,
        });

        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          matchedOrders = rpcData as OrderWithItems[];
        }
      } catch (e) {
        console.warn('RPC track_order not available, using fallback:', e);
      }

      // 2. Fallback to direct table query if RPC returned empty or failed
      if (matchedOrders.length === 0) {
        // Is it a full 36-character UUID?
        const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTerm);

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

        if (isFullUuid) {
          query = query.eq('id', cleanTerm);
        } else {
          // If digits only or phone-like query
          const digitsOnly = cleanTerm.replace(/[^0-9]/g, '');
          if (digitsOnly.length >= 6) {
            query = query.ilike('phone', `%${digitsOnly.slice(-10)}%`);
          } else {
            // Short ID fallback query
            query = query.order('created_at', { ascending: false }).limit(25);
          }
        }

        const { data: directData, error: directErr } = await query
          .order('created_at', { ascending: false })
          .limit(10);

        if (!directErr && directData) {
          if (isFullUuid) {
            matchedOrders = directData as OrderWithItems[];
          } else {
            const digits = cleanTerm.replace(/[^0-9]/g, '');
            if (digits.length >= 6) {
              matchedOrders = directData as OrderWithItems[];
            } else {
              // Filter in-memory for 8-char short ID
              matchedOrders = (directData as OrderWithItems[]).filter((o) =>
                o.id.toLowerCase().startsWith(cleanTerm.toLowerCase())
              );
            }
          }
        }
      }

      if (matchedOrders.length > 0) {
        setOrdersList(matchedOrders);
        setSelectedOrder(matchedOrders[0]);
        // Cache last tracked order ID
        try {
          localStorage.setItem('last_tracked_order_id', matchedOrders[0].id);
        } catch {
          // ignore
        }
      } else {
        setOrdersList([]);
        setSelectedOrder(null);
        setError(
          `No orders found matching "${rawQuery}". Please check your Order ID (from checkout receipt) or enter the registered phone number.`
        );
      }
    } catch (err: any) {
      console.error('Tracking query error:', err);
      setError('Unable to fetch tracking info. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on initial load if query param is in URL
  useEffect(() => {
    if (initialQuery) {
      handleTrack(initialQuery);
    } else {
      try {
        const savedId = localStorage.getItem('last_tracked_order_id');
        if (savedId && !hasSearched) {
          setSearchInput(savedId.slice(0, 8).toUpperCase());
        }
      } catch {
        // ignore
      }
    }
  }, [initialQuery]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim().replace(/^#/, '') });
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
      desc: 'Package delivered successfully',
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const currentShortId = selectedOrder ? selectedOrder.id.slice(0, 8).toUpperCase() : '';

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
          Enter your <strong>Order ID</strong> or <strong>Phone Number</strong> to check live delivery progress (no account required).
        </p>
      </div>

      {/* Smart Search Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs mb-8">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Order ID or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. #8A3F12BC or 9876543210"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-28 sm:pr-32 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Track</span>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
            <span>✓ Search by 8-digit Order ID (e.g. #4F9A1B2C)</span>
            <span>✓ Or search by 10-digit Phone Number</span>
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

      {/* Multiple Orders Selector (if searching by phone number returned >1 orders) */}
      {ordersList.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Found {ordersList.length} Orders for this search — Select an Order to View:
          </h3>
          <div className="space-y-2">
            {ordersList.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const ordShortId = ord.id.slice(0, 8).toUpperCase();
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrder(ord)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-blue-600">#{ordShortId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(ord.status)}`}>
                      {ord.status}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {new Date(ord.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Order Details */}
      {selectedOrder && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Order Header Badge Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg font-bold text-blue-600">#{currentShortId}</span>
                  <button
                    onClick={() => handleCopyId(selectedOrder.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Copy full Order UUID"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
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
                  ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-500 block font-medium">({selectedOrder.payment_method})</span>
              </div>
            </div>

            {/* Cancelled Banner if cancelled */}
            {selectedOrder.status === 'Cancelled' ? (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Order Cancelled</div>
                  <div className="text-xs text-red-600 mt-0.5">
                    This order was cancelled. If you need any assistance, please contact store support below.
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
                      const state = getStepStatus(step.id, selectedOrder.status);
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
                  <span className="font-semibold text-slate-900 text-sm">{selectedOrder.customer_name}</span>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedOrder.phone}</span>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pin_code}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-slate-700">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Payment: <strong>{selectedOrder.payment_method}</strong></span>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Ordered Items ({selectedOrder.order_items?.length || 0})
              </h3>

              <div className="space-y-3">
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  selectedOrder.order_items.map((item) => (
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
                  Contact {storeSettings.store_name || 'our support team'} directly for delivery updates.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {storeSettings.whatsapp_number && (
                <a
                  href={`https://wa.me/${storeSettings.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi, I need help with my Order #${currentShortId}`
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
      {!selectedOrder && !hasSearched && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-slate-600 text-xs space-y-3">
          <div className="font-bold text-slate-900 text-sm">How do I track my order?</div>
          <p>
            You can search using either your <strong>8-character Order ID</strong> (e.g. <code>#4F9A1B2C</code>) from your order confirmation or the <strong>Mobile Phone Number</strong> you entered during checkout.
          </p>
        </div>
      )}
    </div>
  );
}
