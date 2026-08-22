import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, PaymentMethod, CartItem } from '../types';
import { getStorePaymentMethods } from '../lib/utils';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Minus,
  Banknote,
  QrCode,
  Wallet,
  CreditCard,
  AlertCircle,
  Truck,
  ShieldCheck,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cart, clearCart, updateQuantity: updateCartQuantity } = useCart();
  const initialQty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10));

  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [storeUpiId, setStoreUpiId] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const [activePaymentMethods, setActivePaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('COD');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pin_code: '',
  });

  useEffect(() => {
    async function fetchSessionAndItems() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata?.name || '',
          }));
        }

        const { data: settingsData } = await supabase
          .from('settings')
          .select('delivery_charges, upi_id')
          .single();
        if (settingsData) {
          setDeliveryCharge(settingsData.delivery_charges || 0);
          setStoreUpiId(settingsData.upi_id || '');
        }

        const enabledMethods = getStorePaymentMethods().filter(m => m.enabled);
        setActivePaymentMethods(enabledMethods);
        if (enabledMethods.length > 0) {
          setSelectedMethodId(enabledMethods[0].id);
        }

        // If specific product ID is in URL
        if (id) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (productError) throw productError;
          if (productData) {
            const qty = Math.min(initialQty, productData.stock);
            setCheckoutItems([{ product: productData, quantity: Math.max(1, qty) }]);
          }
        } else {
          // Use items from Cart
          setCheckoutItems(cart);
        }

      } catch (err) {
        console.error('Error initializing checkout:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionAndItems();
  }, [id, initialQty]);

  // Sync cart changes if on multi-item checkout
  useEffect(() => {
    if (!id) {
      setCheckoutItems(cart);
    }
  }, [cart, id]);

  const handleQuantityChange = (productId: string, newQty: number) => {
    setCheckoutItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clamped = Math.max(1, Math.min(newQty, item.product.stock));
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );

    if (!id) {
      updateCartQuantity(productId, newQty);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedMethod = activePaymentMethods.find(m => m.id === selectedMethodId);
  const paymentMethodLabel = selectedMethod ? selectedMethod.name : selectedMethodId;

  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = item.product.discount_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const totalAmount = subtotal + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          pin_code: formData.pin_code,
          total_amount: totalAmount,
          payment_method: paymentMethodLabel,
          status: 'Pending',
          user_id: user?.id || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItemsPayload = checkoutItems.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.discount_price || item.product.price,
      }));

      const { error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemsPayload);

      if (itemError) throw itemError;

      // 3. Atomically decrement stock for each item
      for (const item of checkoutItems) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product.id,
          p_quantity: item.quantity,
        });
      }

      // 4. Clear cart
      clearCart();

      setCreatedOrder(order);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Checkout error:', err);
      if (err.message?.includes('Insufficient stock')) {
        setError('Sorry, one or more products do not have enough stock available.');
      } else {
        setError('There was an error processing your order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyOrderId = () => {
    if (createdOrder?.id) {
      navigator.clipboard.writeText(createdOrder.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Preparing checkout...</span>
      </div>
    );
  }

  if (checkoutItems.length === 0 && !success) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm mb-6">Please add items to your cart before proceeding to checkout.</p>
        <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm inline-block">
          Explore Products
        </Link>
      </div>
    );
  }

  if (success && createdOrder) {
    const shortId = createdOrder.id.slice(0, 8).toUpperCase();
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank you for your order!</h1>
        <p className="text-slate-600 mb-6 text-sm">
          Your order has been placed successfully. We will contact you shortly to confirm delivery.
        </p>

        {/* Order Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left mb-8 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Reference ID</span>
              <div className="text-lg font-mono font-bold text-blue-600">#{shortId}</div>
            </div>
            <button
              onClick={handleCopyOrderId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-semibold text-slate-900">{createdOrder.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-semibold text-slate-900">{createdOrder.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="font-semibold text-slate-900 text-right max-w-xs">{createdOrder.address}, {createdOrder.city} - {createdOrder.pin_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold text-slate-900">{createdOrder.payment_method}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2.5 mt-2.5">
              <span className="font-bold text-slate-900">Total Amount:</span>
              <span className="font-bold text-blue-600 text-lg">₹{createdOrder.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/track-order?id=${createdOrder.id}`}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-xs inline-flex items-center justify-center gap-2 text-sm"
          >
            <Truck className="w-4 h-4" />
            <span>Track This Order</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold transition-colors inline-flex items-center justify-center text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Delivery Details</h2>
              {!user && (
                <Link to="/auth?redirect=/checkout" className="text-xs text-blue-600 hover:underline font-semibold">
                  Log in to auto-fill
                </Link>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Rohit Sharma"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Complete Address *</label>
                <textarea
                  required
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="House/Flat No., Street, Landmark..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input
                    required
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Mumbai"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code *</label>
                  <input
                    required
                    type="text"
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleInputChange}
                    placeholder="e.g., 400001"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Select Payment Method
              </h2>

              {activePaymentMethods.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                  No payment methods currently enabled. Please contact store support.
                </div>
              ) : (
                <div className="space-y-3">
                  {activePaymentMethods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    const isCOD = method.type === 'COD' || method.id === 'COD';
                    const isUPI = method.type === 'UPI' || method.id === 'UPI';

                    return (
                      <label
                        key={method.id}
                        className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.id}
                            checked={isSelected}
                            onChange={() => setSelectedMethodId(method.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2.5 flex-1">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isCOD
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isUPI
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {isCOD ? (
                                <Banknote className="w-4 h-4" />
                              ) : isUPI ? (
                                <QrCode className="w-4 h-4" />
                              ) : (
                                <Wallet className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 text-sm block">
                                {method.name}
                              </span>
                              <span className="text-xs text-slate-500">{method.description}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional info when method is selected */}
                        {isSelected && isUPI && storeUpiId && (
                          <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-800">
                              UPI VPA: <span className="font-mono text-blue-600">{storeUpiId}</span>
                            </p>
                            <p className="text-slate-500">Pay via Google Pay, PhonePe, Paytm, or any BHIM UPI app.</p>
                          </div>
                        )}

                        {isSelected && method.instructions && (
                          <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-blue-700 bg-blue-50/60 p-2.5 rounded-lg">
                            {method.instructions}
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || activePaymentMethods.length === 0 || checkoutItems.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-base sm:text-lg font-bold py-4 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:bg-slate-300 disabled:cursor-not-allowed mt-6 cursor-pointer"
            >
              {submitting ? 'Placing Order...' : `Place Order (₹${totalAmount.toLocaleString('en-IN')})`}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 sticky top-24 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Order Summary</h2>

            {/* Product Items List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {checkoutItems.map(({ product: itemProd, quantity: itemQty }) => {
                const itemPrice = itemProd.discount_price || itemProd.price;
                return (
                  <div key={itemProd.id} className="flex gap-3.5 bg-white p-3 rounded-xl border border-slate-200/80">
                    <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {itemProd.image_url ? (
                        <img src={itemProd.image_url} alt={itemProd.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1 text-xs">{itemProd.name}</h3>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">₹{itemPrice.toLocaleString('en-IN')}</p>
                      </div>

                      {/* Interactive Quantity Selector */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500 font-medium">Qty:</span>
                        <div className="flex items-center border border-slate-200 bg-white rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(itemProd.id, itemQty - 1)}
                            disabled={itemQty <= 1}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-900">{itemQty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(itemProd.id, itemQty + 1)}
                            disabled={itemQty >= itemProd.stock}
                            className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-sm border-t border-slate-200 pt-4">
              <div className="flex justify-between text-slate-600 text-xs sm:text-sm">
                <span>Items Subtotal</span>
                <span className="font-medium text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs sm:text-sm">
                <span>Delivery Charges</span>
                <span className="font-medium text-slate-900">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryCharge.toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
              <div>
                <span className="font-bold text-slate-900 block">Total Amount</span>
                <span className="text-[11px] text-slate-500">Includes all taxes & delivery</span>
              </div>
              <span className="text-2xl font-extrabold text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200/80">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
