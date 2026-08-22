import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, Store, LogOut, User, ShoppingBag, Shield, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getStoredStoreName, saveStoredStoreName } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function Layout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [storeName, setStoreName] = useState<string>(getStoredStoreName());
  const { totalItems, toggleCart, toastMessage } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 2. Fetch Store Settings for dynamic store name
    async function loadSettings() {
      try {
        const { data } = await supabase.from('settings').select('store_name').single();
        if (data?.store_name) {
          setStoreName(data.store_name);
          saveStoredStoreName(data.store_name);
        }
      } catch (err) {
        console.error('Error loading settings in Layout:', err);
      }
    }

    loadSettings();

    // 3. Listen for store settings update event from Admin
    const handleSettingsUpdate = () => {
      setStoreName(getStoredStoreName());
    };

    window.addEventListener('store_settings_updated', handleSettingsUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('store_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isAdmin = user?.app_metadata?.role === 'admin';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-lg sm:text-xl tracking-tight shrink-0 whitespace-nowrap">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="whitespace-nowrap">{storeName}</span>
          </Link>
          
          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-3">
             {/* Header Cart Button with Live Badge */}
             <button
               onClick={toggleCart}
               className="relative p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 font-semibold text-sm"
               title="View Cart"
             >
               <ShoppingCart className="w-5 h-5" />
               <span className="hidden md:inline">Cart</span>
               {totalItems > 0 && (
                 <span className="bg-blue-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200 shadow-xs">
                   {totalItems}
                 </span>
               )}
             </button>

             {user ? (
               <div className="flex items-center gap-2">
                 {isAdmin && (
                   <Link
                     to="/admin"
                     className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors"
                     title="Admin Panel"
                   >
                     <Shield className="w-4 h-4 text-purple-600" />
                     <span className="hidden sm:inline">Admin</span>
                   </Link>
                 )}
                 <Link 
                   to="/my-orders"
                   className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                   title="View Profile & My Orders"
                 >
                   <User className="w-4 h-4 text-blue-600" />
                   <span className="hidden md:inline">{user.user_metadata?.name || user.email}</span>
                   <ShoppingBag className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                 </Link>
                 <button 
                   onClick={handleLogout}
                   className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                   title="Sign Out"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>

             ) : (
               <Link 
                 to="/auth"
                 className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors"
               >
                 Log In
               </Link>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ searchQuery }} />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p className="font-bold text-slate-900 mb-2">{storeName}</p>
          <div className="flex justify-center gap-4 mt-4 flex-wrap text-sm text-blue-600 font-medium">
            <Link to="/policies" className="hover:underline">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/policies" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/policies" className="hover:underline">Refund Policy</Link>
            <span>•</span>
            <Link to="/policies" className="hover:underline">Shipping Policy</Link>
            <span>•</span>
            <Link to="/policies" className="hover:underline">Contact Us</Link>
          </div>
          <p className="text-sm mt-6">&copy; {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Add to Cart Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 border border-slate-800">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
            ✓
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
