import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Package } from 'lucide-react';

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
    return <div className="py-20 text-center text-slate-500">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          No products found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
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
                      <span className="text-xl font-bold text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  
                  <Link 
                    to={`/product/${product.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
