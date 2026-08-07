import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Package, Zap, ShieldCheck, Truck, ArrowRight } from 'lucide-react';

export default function Home() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error: fetchError } = await supabase.from('products').select('*');
        if (fetchError) throw fetchError;
        if (data) setProducts(data);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500 mb-4 font-medium text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner Banner (Mobile & Desktop) */}
      {!searchQuery && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-blue-950/10">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Great Deals Today</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-2">
              Next-Gen Electronics at Your Doorstep
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Shop genuine smartphones, 4K TVs, wireless audio, and accessories with instant store delivery.
            </p>
            <div className="flex items-center gap-4 text-[11px] sm:text-xs font-medium text-slate-300">
              <div className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span>100% Genuine</span>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 sm:w-64 h-40 sm:h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* Section Header */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Electronics'}
        </h2>
        <span className="text-xs text-slate-500 font-medium">{filteredProducts.length} Products</span>
      </div>

      {/* Product Grid: 2 Columns on Mobile, 3 on Tablet, 4 on Desktop */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/60 p-6">
          No products found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map(product => {
            const currentPrice = product.discount_price || product.price;
            const hasDiscount = !!product.discount_price;

            return (
              <div 
                key={product.id} 
                className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden flex flex-col group hover:shadow-lg hover:border-blue-200 transition-all duration-200"
              >
                {/* Image Container */}
                <Link to={`/product/${product.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badge Overlays */}
                  {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                      SALE
                    </div>
                  )}

                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase">
                      Sold Out
                    </div>
                  )}
                </Link>
                
                {/* Details */}
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <Link 
                    to={`/product/${product.id}`} 
                    className="text-xs sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2"
                  >
                    {product.name}
                  </Link>

                  <div className="mt-auto pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      {hasDiscount ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-xs text-slate-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                          <span className="text-sm sm:text-lg font-black text-slate-900">₹{currentPrice.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-sm sm:text-lg font-black text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    
                    <Link 
                      to={`/product/${product.id}`}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 sm:hidden" />
                    </Link>
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
