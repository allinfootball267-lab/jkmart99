import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Package,
  Search,
  ImagePlus,
} from 'lucide-react';

const emptyProduct = {
  name: '',
  description: '',
  specifications: '',
  price: '',
  discount_price: '',
  stock: '',
  image_url: '',
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      specifications: product.specifications || '',
      price: String(product.price),
      discount_price: product.discount_price ? String(product.discount_price) : '',
      stock: String(product.stock),
      image_url: product.image_url || '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || form.stock === '') {
      setError('Name, price, and stock are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description || null,
      specifications: form.specifications || null,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock: Number(form.stock),
      image_url: form.image_url || null,
    };

    try {
      if (editing) {
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert(payload);
        if (insertError) throw insertError;
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">{products.length} products in your store</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
        />
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-slate-50 flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-slate-200" />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
                <div className="flex items-baseline gap-2 mb-3">
                  {product.discount_price ? (
                    <>
                      <span className="text-lg font-bold text-slate-900">
                        ₹{product.discount_price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-slate-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      product.stock > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g., Wireless Earbuds"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  placeholder="Describe the product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specifications (one per line)</label>
                <textarea
                  value={form.specifications}
                  onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  placeholder="Bluetooth 5.3&#10;Battery: 8 hours&#10;IPX5 Water Resistant"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={form.discount_price}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="799"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ImagePlus className="w-4 h-4" /> Image URL
                  </span>
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
