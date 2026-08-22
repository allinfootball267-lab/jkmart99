import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Package, ArrowLeft, ShieldCheck, Truck, Plus, Minus, ShoppingCart, Sparkles, Tag, Zap } from 'lucide-react';
import { getProductCategories } from '../lib/utils';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProductAndOthers() {
      if (!id) return;
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const { data: currentProd, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
          
        if (prodError) throw prodError;
        if (currentProd) {
          setProduct(currentProd);
          setQuantity(1);
        }

        // Fetch other products
        const { data: allProducts, error: othersError } = await supabase
          .from('products')
          .select('*')
          .neq('id', id)
          .limit(8);

        if (!othersError && allProducts) {
          setOtherProducts(allProducts);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProductAndOthers();
  }, [id]);

  const handleQuantityChange = (newQty: number) => {
    if (!product) return;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addToCart(product, quantity, true);
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    addToCart(product, quantity, false);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading product details...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>
      </div>
    );
  }

  const currentPrice = product.discount_price || product.price;
  const totalPrice = currentPrice * quantity;

  return (
    <div className="space-y-12">
      <div>
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
          {/* Image */}
          <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-24 h-24 text-slate-300" />
            )}
            {product.discount_price && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                SALE
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {getProductCategories(product).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold"
                >
                  <Tag className="w-3 h-3 text-blue-600" />
                  {cat}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>
            
            <div className="flex items-end gap-3 mb-6 pb-6 border-b border-slate-100">
              <span className="text-3xl sm:text-4xl font-bold text-slate-900">₹{currentPrice.toLocaleString('en-IN')}</span>
              {product.discount_price && (
                <span className="text-base sm:text-lg text-slate-400 line-through mb-1">₹{product.price.toLocaleString('en-IN')}</span>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wider text-slate-500">Description</h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{product.description}</p>
            </div>

            {product.specifications && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wider text-slate-500">Specifications</h3>
                <ul className="text-slate-600 space-y-1 list-disc list-inside text-sm">
                  {product.specifications.split('\n').map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Fast Local Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Genuine</span>
                </div>
              </div>

              {product.stock > 0 ? (
                <div className="space-y-4 pt-2">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-sm font-semibold text-slate-900 block">Quantity</span>
                      <span className="text-xs text-emerald-600 font-medium">{product.stock} units available</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dual Action Buttons: Add to Cart + Buy Now */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 text-base font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-xs"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-base font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      <span>Buy Now • ₹{totalPrice.toLocaleString('en-IN')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-500 font-medium text-sm">Out of Stock</p>
                  <button 
                    disabled
                    className="w-full bg-slate-200 text-slate-400 text-base font-semibold py-4 rounded-xl cursor-not-allowed"
                  >
                    Currently Unavailable
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Other Products Section */}
      {otherProducts.length > 0 && (
        <div className="pt-10 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Explore More</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">You May Also Like</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherProducts.map((item) => {
              const itemCategories = getProductCategories(item);
              const itemCurrentPrice = item.discount_price || item.price;
              const hasDiscount = Boolean(item.discount_price);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
                >
                  <Link to={`/product/${item.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-16 h-16" />
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        SALE
                      </div>
                    )}
                    {/* Category Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[75%]">
                      {itemCategories.slice(0, 1).map((cat) => (
                        <span
                          key={cat}
                          className="bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-blue-400" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <Link
                      to={`/product/${item.id}`}
                      className="text-base font-semibold text-slate-900 mb-1 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <div>
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 line-through">₹{item.price.toLocaleString('en-IN')}</span>
                            <span className="text-lg font-bold text-slate-900">₹{itemCurrentPrice.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-slate-900">₹{item.price.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(item, 1, true)}
                        disabled={item.stock <= 0}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1 shadow-xs ${
                          item.stock > 0
                            ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20 cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{item.stock > 0 ? 'Add to Cart' : 'Sold Out'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
