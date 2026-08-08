import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*'),
          supabase.from('products').select('id'),
        ]);

        const orders = (ordersRes.data || []) as Order[];
        const products = productsRes.data || [];

        setStats({
          totalOrders: orders.length,
          totalRevenue: orders
            .filter((o) => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + Number(o.total_amount), 0),
          totalProducts: products.length,
          pendingOrders: orders.filter((o) => o.status === 'Pending').length,
          confirmedOrders: orders.filter((o) => o.status === 'Confirmed').length,
          shippedOrders: orders.filter((o) => o.status === 'Shipped').length,
          deliveredOrders: orders.filter((o) => o.status === 'Delivered').length,
          cancelledOrders: orders.filter((o) => o.status === 'Cancelled').length,
        });

        setRecentOrders(
          orders
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 8)
        );
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      label: 'Products Listed',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
    },
  ];

  const statusBreakdown = [
    { label: 'Pending', count: stats.pendingOrders, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Confirmed', count: stats.confirmedOrders, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Shipped', count: stats.shippedOrders, icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'Delivered', count: stats.deliveredOrders, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Cancelled', count: stats.cancelledOrders, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-indigo-100 text-indigo-700';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back — here's your store overview.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <TrendingUp className="w-3.5 h-3.5" />
          Live
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} ${card.shadow} shadow-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statusBreakdown.map((item) => (
            <div key={item.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${item.color}`}>
              <item.icon className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-lg font-bold">{item.count}</div>
                <div className="text-xs font-medium opacity-80">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3 font-semibold">Order ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-blue-600">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{order.customer_name}</div>
                    <div className="text-xs text-slate-400">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
