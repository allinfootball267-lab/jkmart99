import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { getProductCategories } from '../../lib/utils';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Package,
  Search,
  ImagePlus,
  Tag,
  Filter,
  FolderPlus,
  Check,
} from 'lucide-react';

const DEFAULT_SUGGESTED_CATEGORIES = [
  'Dinnerware & Crockery',
  'Melamine Sets',
  'Electronics',
  'Smartphones',
  'Audio & Earbuds',
  'Gift Sets',
  'Accessories',
];

type ProductFormData = {
  name: string;
  categories: string[];
  description: string;
  specifications: string;
  price: string;
  discount_price: string;
  stock: string;
  image_url: string;
};

const emptyProduct: ProductFormData = {
  name: '',
  categories: [],
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Custom categories state (stored in localStorage)
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jkmart_custom_categories');
      return saved ? JSON.parse(saved) : DEFAULT_SUGGESTED_CATEGORIES;
    } catch {
      return DEFAULT_SUGGESTED_CATEGORIES;
    }
  });
  
  const [newCatInput, setNewCatInput] = useState('');
  const [customNewCatInput, setCustomNewCatInput] = useState('');
  const [categorySuccessMsg, setCategorySuccessMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyProduct);
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

  // Sync customCategories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jkmart_custom_categories', JSON.stringify(customCategories));
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  }, [customCategories]);

  // Combine dynamic categories from current products and custom categories list
  const allCategories: string[] = Array.from(
    new Set<string>([
      ...products.flatMap((p) => getProductCategories(p)).filter(Boolean),
      ...customCategories,
    ])
  );

  const handleAddNewCategoryGlobal = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!customCategories.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }
    setCategorySuccessMsg(`Category "${trimmed}" added!`);
    setTimeout(() => setCategorySuccessMsg(null), 2500);
  };

  const handleDeleteCategoryGlobal = (catToDelete: string) => {
    setCustomCategories(prev => prev.filter(c => c !== catToDelete));
  };

  // Add/remove category on the active product form
  const handleToggleFormCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    
    setForm(prev => {
      const exists = prev.categories.includes(trimmed);
      const updated = exists 
        ? prev.categories.filter(c => c !== trimmed)
        : [...prev.categories, trimmed];
      return { ...prev, categories: updated };
    });

    if (!customCategories.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }
  };

  const handleRemoveFormCategory = (catToRemove: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== catToRemove)
    }));
  };

  const handleAddCustomCategoryToForm = () => {
    const trimmed = customNewCatInput.trim();
    if (!trimmed) return;
    if (!form.categories.includes(trimmed)) {
      setForm(prev => ({ ...prev, categories: [...prev.categories, trimmed] }));
    }
    if (!customCategories.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
    }
    setCustomNewCatInput('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setCustomNewCatInput('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    const assignedCats = getProductCategories(product);
    setForm({
      name: product.name,
      categories: assignedCats,
      description: product.description || '',
      specifications: product.specifications || '',
      price: String(product.price),
      discount_price: product.discount_price ? String(product.discount_price) : '',
      stock: String(product.stock),
      image_url: product.image_url || '',
    });
    setCustomNewCatInput('');
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

    const categoriesList = form.categories.length > 0 ? form.categories : ['General'];
    const categoryString = categoriesList.join(', ');

    // Prepare specifications with Categories embedded for safe fallback
    let specs = form.specifications.trim();
    if (specs) {
      if (specs.match(/(?:Categories|Category|Cat):/i)) {
        specs = specs.replace(/(?:Categories|Category|Cat):\s*[^\r\n]+/i, `Categories: ${categoryString}`);
      } else {
        specs = `Categories: ${categoryString}\n${specs}`;
      }
    } else {
      specs = `Categories: ${categoryString}`;
    }

    const payloadWithCol: any = {
      name: form.name,
      category: categoryString,
      description: form.description || null,
      specifications: specs || null,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock: Number(form.stock),
      image_url: form.image_url || null,
    };

    const payloadFallback: any = {
      name: form.name,
      description: form.description || null,
      specifications: specs || null,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock: Number(form.stock),
      image_url: form.image_url || null,
    };

    try {
      if (editing) {
        // Try update with category column
        const { error: updateError } = await supabase
          .from('products')
          .update(payloadWithCol)
          .eq('id', editing.id);

        if (updateError) {
          const { error: fallbackError } = await supabase
            .from('products')
            .update(payloadFallback)
            .eq('id', editing.id);
          if (fallbackError) throw fallbackError;
        }
      } else {
        // Try insert with category column
        const { error: insertError } = await supabase.from('products').insert(payloadWithCol);
        if (insertError) {
          const { error: fallbackError } = await supabase.from('products').insert(payloadFallback);
          if (fallbackError) throw fallbackError;
        }
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

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const prodCategories = getProductCategories(p);
    const matchesCategory = selectedCategory === 'All' || prodCategories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const availableCategoriesForFilter: string[] = [
    'All',
    ...Array.from(new Set<string>(products.flatMap((p) => getProductCategories(p)).filter(Boolean))),
  ];

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
          <h1 className="text-2xl font-bold text-slate-900">Products & Categories</h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} products in store • {allCategories.length} categories configured
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setNewCatInput('');
              setShowCategoryModal(true);
            }}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-xs text-sm"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            Manage Categories
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3 mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter by Category:
          </span>
          {availableCategoriesForFilter.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className="ml-1 opacity-70">
                  ({products.filter(p => getProductCategories(p).includes(cat)).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const categories = getProductCategories(product);

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="aspect-video bg-slate-50 relative flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-slate-200" />
                  )}
                  {/* Category Pill Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 max-w-[85%]">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-blue-400" />
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
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
                  <div className="mt-auto pt-2 flex items-center justify-between">
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
            );
          })}
        </div>
      )}

      {/* Global Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Manage Store Categories</h2>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Add New Category Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Create New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCatInput.trim()) {
                        handleAddNewCategoryGlobal(newCatInput);
                        setNewCatInput('');
                      }
                    }}
                    placeholder="e.g. Cookware, Gift Sets..."
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCatInput.trim()) {
                        handleAddNewCategoryGlobal(newCatInput);
                        setNewCatInput('');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {categorySuccessMsg && (
                  <p className="text-xs text-green-600 font-medium mt-1.5 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {categorySuccessMsg}
                  </p>
                )}
              </div>

              {/* List of Active Categories */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Configured Categories ({allCategories.length})
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {allCategories.map((cat) => {
                    const count = products.filter(p => getProductCategories(p).includes(cat)).length;

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-800">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {count} {count === 1 ? 'product' : 'products'}
                          </span>
                          <button
                            onClick={() => handleDeleteCategoryGlobal(cat)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal with Multi-Category Support */}
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
                  placeholder="e.g., CLAY STORY 7 Pcs Melamine Set"
                />
              </div>

              {/* Multi-Category Selection & Tag Manager */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-blue-600" /> Categories (Select 1 or more)
                </label>

                {/* Currently Assigned Categories (With Delete 'X' Button) */}
                <div>
                  <span className="text-xs text-slate-500 block mb-1.5 font-medium">Assigned to this product:</span>
                  {form.categories.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No categories assigned yet. Choose from below or type a new one.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {form.categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFormCategory(cat)}
                            className="p-0.5 hover:bg-blue-700 rounded transition-colors ml-0.5"
                            title={`Remove ${cat}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline New Category Creator */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customNewCatInput}
                      onChange={(e) => setCustomNewCatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategoryToForm();
                        }
                      }}
                      placeholder="Type custom category name..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategoryToForm}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Available Categories to Click & Toggle */}
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Click to add/remove:</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {allCategories.map((cat) => {
                        const isSelected = form.categories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleToggleFormCategory(cat)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                  placeholder="Brand: GAYTRI&#10;Material: Premium Melamine&#10;Set Contents: 7 Pcs"
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
