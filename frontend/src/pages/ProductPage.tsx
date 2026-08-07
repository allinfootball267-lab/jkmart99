import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Package, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (data) setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h2>
        <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
      </div>
    );
  }

  const currentPrice = product.discount_price || product.price;

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="bg-slate-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center border border-slate-100">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-32 h-32 text-slate-300" />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>
          
          <div className="flex items-end gap-3 mb-6 pb-6 border-b border-slate-100">
            <span className="text-4xl font-bold text-slate-900">₹{currentPrice.toLocaleString('en-IN')}</span>
            {product.discount_price && (
              <span className="text-lg text-slate-400 line-through mb-1">₹{product.price.toLocaleString('en-IN')}</span>
            )}
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          {product.specifications && (
            <div className="mb-8">
              <h3 className="font-semibold text-slate-900 mb-2">Specifications</h3>
              <ul className="text-slate-600 space-y-1 list-disc list-inside">
                {product.specifications.split('\n').map((spec, i) => (
                  <li key={i}>{spec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <Truck className="w-4 h-4" />
                <span>Fast Local Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
                <span>Genuine Product</span>
              </div>
            </div>

            {product.stock > 0 ? (
              <div className="space-y-3">
                <p className="text-green-600 font-medium text-sm">{product.stock} in stock</p>
                <button 
                  onClick={() => navigate(`/checkout/${product.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-4 rounded-xl transition-colors shadow-sm"
                >
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-red-500 font-medium text-sm">Out of Stock</p>
                <button 
                  disabled
                  className="w-full bg-slate-200 text-slate-400 text-lg font-semibold py-4 rounded-xl cursor-not-allowed"
                >
                  Currently Unavailable
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
