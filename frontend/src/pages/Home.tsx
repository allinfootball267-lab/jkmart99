import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { getProductCategories } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { Package, ShoppingCart, Tag, Filter } from 'lucide-react';

export default function Home() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error: fetchError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
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

  const categories = [
    'All',
    ...Array.from(new Set(products.flatMap((p) => getProductCategories(p)).filter(Boolean))),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const prodCats = getProductCategories(p);
    const matchesCategory = selectedCategory === 'All' || prodCats.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Navigation Bar - Mobile Optimized */}
      {categories.length > 1 && (
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-8 sm:pr-0 scroll-smooth">
            <div className="items-center gap-1 text-slate-400 text-xs font-semibold uppercase tracking-wider shrink-0 mr-1 hidden sm:flex">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {/* Subtle right gradient fade on mobile to indicate more categories */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" />
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 p-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different category or clearing your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const productCategories = getProductCategories(product);
            const currentPrice = product.discount_price || product.price;

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                <Link to={`/product/${product.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-16 h-16" />
                    </div>
                  )}
                  {product.discount_price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      SALE
                    </div>
                  )}
                  {/* Category Badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[75%]">
                    {productCategories.slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-blue-400" />
                        {cat}
                      </span>
                    ))}
                    {productCategories.length > 2 && (
                      <span className="bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                        +{productCategories.length - 2}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-5 flex flex-col flex-1">
                  <Link to={`/product/${product.id}`} className="text-lg font-semibold text-slate-900 mb-1 hover:text-blue-600 transition-colors line-clamp-2">
                    {product.name}
                  </Link>

                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <div>
                      {product.discount_price ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                          <span className="text-xl font-bold text-slate-900">₹{product.discount_price.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-slate-900">₹{currentPrice.toLocaleString('en-IN')}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(product, 1, true)}
                      disabled={product.stock <= 0}
                      className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs ${
                        product.stock > 0
                          ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{product.stock > 0 ? 'Add to Cart' : 'Sold Out'}</span>
                    </button>
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
