import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, Store, LogOut, User, ShoppingBag, Sparkles } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Banner Accent */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
        <span>Fast Express Delivery Available in City • Shop Latest Electronics</span>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200/80 sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-blue-600 font-extrabold text-xl tracking-tight shrink-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Store className="w-5 h-5" />
              </div>
              <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">JKmart 99</span>
            </Link>
            
            {/* Desktop Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search smartphones, TVs, audio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
            
            {/* User Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
               {user ? (
                 <div className="flex items-center gap-1.5 sm:gap-2">
                   <Link 
                     to="/my-orders"
                     className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-2 rounded-xl transition-colors border border-slate-200/60"
                     title="View Profile & Orders"
                   >
                     <User className="w-4 h-4 text-blue-600 shrink-0" />
                     <span className="max-w-[100px] sm:max-w-[140px] truncate">{user.user_metadata?.name || user.email?.split('@')[0]}</span>
                     <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
                   </Link>
                   <button 
                     onClick={handleLogout}
                     className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                     title="Sign Out"
                   >
                     <LogOut className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
                 <Link 
                   to="/auth"
                   className="text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
                 >
                   Log In
                 </Link>
               )}
            </div>
          </div>

          {/* Mobile Search Bar (visible on mobile screens) */}
          <div className="pb-3 sm:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        <Outlet context={{ searchQuery }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900 text-base">JKmart 99</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">Your trusted neighborhood electronics store.</p>
          <div className="flex justify-center gap-3 sm:gap-4 mt-4 flex-wrap text-xs sm:text-sm text-blue-600 font-medium">
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
          <p className="text-xs text-slate-400 mt-6">&copy; {new Date().getFullYear()} JKmart 99. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
