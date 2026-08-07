import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Package, Clock, Truck, CheckCircle2, XCircle, ArrowLeft, ShoppingBag, MapPin, Calendar, CreditCard } from 'lucide-react';

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

export default function MyOrders() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserAndOrders() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth?redirect=/my-orders');
          return;
        }

        setUser(session.user);

        // Fetch user's orders with items and product details
        const { data, error } = await supabase
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
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setOrders(data as OrderWithItems[]);
      } catch (err) {
        console.error('Error fetching shopper orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndOrders();
  }, [navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            Order Received (Pending)
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed by Store
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
            <Truck className="w-3.5 h-3.5" />
            Out for Delivery
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading your profile & orders...</div>;

  return (
    <div className="max-w-4xl mx-auto py-4">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Shopping
      </Link>

      {/* User Header Profile */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">Customer Account</span>
            <h1 className="text-2xl font-bold">{user?.user_metadata?.name || 'Valued Shopper'}</h1>
            <p className="text-sm text-blue-100 mt-0.5">{user?.email}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium border border-white/20">
            Total Orders: <span className="font-bold text-white ml-1">{orders.length}</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-blue-600" />
        <span>My Order History</span>
      </h2>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No Orders Placed Yet</h3>
          <p className="text-slate-500 text-sm mb-6">When you place an order, you will see it listed here with real-time status updates.</p>
          <Link 
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors inline-block"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const shortId = order.id.slice(0, 8).toUpperCase();
            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-base font-bold text-blue-600">#{shortId}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Placed on {new Date(order.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Amount</span>
                    <div className="text-xl font-bold text-slate-900">₹{order.total_amount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Products List */}
                <div className="py-4 space-y-3">
                  {order.order_items && order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {item.products?.image_url ? (
                          <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm">{item.products?.name || 'Product'}</div>
                        <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{item.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Delivery Details */}
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Delivering to: <strong>{order.customer_name}</strong> ({order.address}, {order.city} - {order.pin_code})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment: <strong>{order.payment_method}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
