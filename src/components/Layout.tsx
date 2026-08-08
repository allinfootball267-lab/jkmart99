import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, Store, LogOut, User, ShoppingBag, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function Layout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
            <Store className="w-6 h-6" />
            <span>JKmart 99</span>
          </Link>
          
          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-sm font-medium text-slate-600 hidden md:block">
               Neighborhood Electronics Shop
             </div>
             
             {user ? (
               <div className="flex items-center gap-2">
                 {isAdmin && (
                   <Link
                     to="/admin"
                     className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors"
                     title="Admin Panel"
                   >
                     <Shield className="w-4 h-4 text-purple-600" />
                     <span>Admin Panel</span>
                   </Link>
                 )}
                 <Link 
                   to="/my-orders"
                   className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                   title="View Profile & My Orders"
                 >
                   <User className="w-4 h-4 text-blue-600" />
                   <span>{user.user_metadata?.name || user.email}</span>
                   <ShoppingBag className="w-3.5 h-3.5 text-slate-400 ml-1" />
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
                 className="text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-lg transition-colors"
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
          <p className="font-medium text-slate-900 mb-2">JKmart 99</p>
          <p className="text-sm">Your trusted local electronics store.</p>
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
          <p className="text-sm mt-6">&copy; {new Date().getFullYear()} JKmart 99. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
