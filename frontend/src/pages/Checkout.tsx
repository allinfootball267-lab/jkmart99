import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ArrowLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(50);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pin_code: '',
    payment_method: 'COD' as 'COD' | 'UPI'
  });

  useEffect(() => {
    async function fetchSessionAndProduct() {
      if (!id) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata?.name || '',
          }));
        }

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (productError) throw productError;
        if (productData) setProduct(productData);
        
        const { data: settingsData } = await supabase.from('settings').select('delivery_charges').single();
        if (settingsData) setDeliveryCharge(settingsData.delivery_charges);
        
      } catch (err) {
        console.error('Error initialization during checkout:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionAndProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setSubmitting(true);
    setError(null);
    
    const currentPrice = product.discount_price || product.price;
    const totalAmount = currentPrice + deliveryCharge;

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
          payment_method: formData.payment_method,
          status: 'Pending',
          user_id: user?.id || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: 1,
          price: currentPrice
        });

      if (itemError) throw itemError;

      // 3. Atomically decrement stock via database function
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: product.id,
        p_quantity: 1
      });

      if (stockError) throw stockError;

      setCreatedOrder(order);
      setSuccess(true);
    } catch (err: any) {
      console.error('Checkout error:', err);
      if (err.message?.includes('Insufficient stock')) {
        setError('Sorry, this product is now out of stock.');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading checkout...</div>;
  if (!product) return <div className="py-20 text-center">Product not found.</div>;

  if (success && createdOrder) {
    const shortId = createdOrder.id.slice(0, 8).toUpperCase();
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank you for your order!</h1>
        <p className="text-slate-600 mb-6">
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
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Full ID</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-sm">
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
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
              <span className="font-bold text-slate-900">Total Amount Paid/Due:</span>
              <span className="font-bold text-blue-600 text-base">₹{createdOrder.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <Link 
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-sm inline-block"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const currentPrice = product.discount_price || product.price;
  const totalAmount = currentPrice + deliveryCharge;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to={`/product/${product.id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Product
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Delivery Details</h2>
              {!user && (
                <Link to={`/auth?redirect=/checkout/${product.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                  Log in to auto-fill details
                </Link>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
                <textarea 
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="House/Flat No, Street Name, Area"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input 
                    required
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code</label>
                  <input 
                    required
                    type="text" 
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 pt-4">Payment Method</h2>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="COD"
                  checked={formData.payment_method === 'COD'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-900">Cash on Delivery (COD)</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="UPI"
                  checked={formData.payment_method === 'UPI'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-900">UPI QR Code (Pay via any app)</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 rounded-xl transition-colors shadow-sm disabled:bg-blue-400 mt-6"
            >
              {submitting ? 'Placing Order...' : `Place Order (₹${totalAmount.toLocaleString('en-IN')})`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 sticky top-24">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-4 mb-4">Order Summary</h2>
            
            <div className="flex gap-4 mb-6">
              <div className="w-20 h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                 {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-slate-300 text-xs">No img</div>
                 )}
              </div>
              <div>
                <h3 className="font-medium text-slate-900 line-clamp-2">{product.name}</h3>
                <p className="text-slate-500 mt-1">Qty: 1</p>
                <p className="font-semibold text-slate-900 mt-1">₹{currentPrice.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t border-slate-200 pt-4 mb-4">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{currentPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharge.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
