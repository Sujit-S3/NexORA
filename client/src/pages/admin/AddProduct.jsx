import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, UploadCloud, X, Check, Plus, Sparkles,
  Bold, Italic, List, Tag, Package, IndianRupee
} from 'lucide-react';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';
import Spinner from '@components/common/Spinner';

const Toggle = ({ value, onChange, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors ${value ? 'bg-[#D4AF37]' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const AddProduct = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [previews, setPreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const [form, setForm] = useState({
    name: '', brand: '', category: '', description: '',
    price: '', discountPrice: '', stock: '',
    gender: 'Unisex', sizeChartHtml: '',
    isFeatured: false, isNewArrival: true, isBestSeller: false, isActive: true,
    tags: [], variants: [],
  });

  useEffect(() => {
    categoryService.getAll().then(r => {
      const cats = r.data.data || [];
      setCategories(cats);
      if (cats.length) setForm(f => ({ ...f, category: cats[0]._id }));
    });
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  const handleFiles = (files) => {
    const arr = Array.from(files);
    setImageFiles(prev => [...prev, ...arr].slice(0, 10));
    const urls = arr.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...urls].slice(0, 10));
  };

  const removeImage = (i) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.category) {
      return alert('Name, price, stock and category are required');
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.discountPrice) delete payload.discountPrice;
      payload.price = Number(payload.price);
      payload.stock = Number(payload.stock);
      if (payload.discountPrice) payload.discountPrice = Number(payload.discountPrice);
      payload.variants = payload.variants.map(v => ({ ...v, stock: Number(v.stock) }));

      const res = await productService.create(payload);
      const productId = res.data.data._id;

      if (imageFiles.length > 0) {
        const fd = new FormData();
        imageFiles.forEach(f => fd.append('images', f));
        await productService.uploadImages(productId, fd);
      }

      navigate('/admin/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, required, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 bg-white/60 dark:bg-[#0B1220]/60 border border-gray-200/70 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 transition-all text-sm placeholder-gray-400";

  return (
    <div className="min-h-full flex flex-col font-sans">
      {/* Topbar */}
      <header className="flex items-center gap-4 px-8 py-5 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] bg-white/80 dark:bg-[#0B1220]/80 sticky top-0 z-10 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white/10 transition-colors text-gray-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">Add New Product</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create and publish a new product to your store</p>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Product Identity */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">1</div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Product Identity</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InputField label="Product Name" required>
                    <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Rolex Submariner Date" />
                  </InputField>
                </div>
                <InputField label="Brand">
                  <input type="text" value={form.brand} onChange={e => set('brand', e.target.value)} className={inputCls} placeholder="e.g. Rolex" />
                </InputField>
                <InputField label="Category" required>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </InputField>
                <InputField label="Gender / Audience" required>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </InputField>
              </div>
            </section>

            {/* 2. Description */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">2</div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Product Story</h2>
                </div>
              </div>
              <InputField label="Description" required>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={5}
                  className={inputCls + ' resize-none'}
                  placeholder="Describe the product — features, materials, use cases..."
                />
              </InputField>
            </section>

            {/* 3. Pricing & Inventory */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">3</div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pricing & Inventory</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <InputField label="Price (₹)" required>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls + ' pl-8'} placeholder="0" />
                  </div>
                </InputField>
                <InputField label="Compare Price (₹)">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" min="0" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} className={inputCls + ' pl-8'} placeholder="Original price" />
                  </div>
                </InputField>
                <InputField label="Stock Quantity" required>
                  <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} className={inputCls} placeholder="0" />
                </InputField>
              </div>
            </section>

            {/* 4. Tags */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">4</div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tags</h2>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                  className={inputCls + ' flex-1'}
                  placeholder="Type a tag and press Enter or +"
                />
                <button type="button" onClick={addTag} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium">
                      <Tag className="w-3 h-3" />{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* 5. Product Variations (Sizes) */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">5</div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sizes & Variations</h2>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { size: '', stock: 0 }] }))} className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#B38945]">
                  + Add Size
                </button>
              </div>
              
              {form.variants.length === 0 ? (
                <p className="text-sm text-gray-500">No variations added. Using global stock.</p>
              ) : (
                <div className="space-y-3">
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="text" value={v.size} onChange={e => {
                        const newVars = [...form.variants];
                        newVars[i].size = e.target.value;
                        set('variants', newVars);
                      }} placeholder="Size (e.g. M)" className={inputCls} />
                      <input type="number" min="0" value={v.stock} onChange={e => {
                        const newVars = [...form.variants];
                        newVars[i].stock = e.target.value;
                        set('variants', newVars);
                      }} placeholder="Stock" className={inputCls} />
                      <button type="button" onClick={() => {
                        const newVars = [...form.variants];
                        newVars.splice(i, 1);
                        set('variants', newVars);
                      }} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 6. Size Chart HTML */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">6</div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Size Chart (HTML/Table)</h2>
              </div>
              <InputField label="Size Guide Rich Text / HTML">
                <textarea
                  value={form.sizeChartHtml}
                  onChange={e => set('sizeChartHtml', e.target.value)}
                  rows={4}
                  className={inputCls + ' resize-none font-mono text-xs'}
                  placeholder="<table><tr><th>Size</th><th>Chest</th></tr>...</table>"
                />
              </InputField>
            </section>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => navigate('/admin/products')}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-[#0B1220] text-sm font-bold shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_20px_rgba(212,175,55,0.5)] transition-all disabled:opacity-50">
                {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                {saving ? 'Publishing...' : 'Publish Product'}
              </button>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-6">

            {/* Media Studio */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0B1220] text-xs font-bold">7</div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Media Studio</h2>
              </div>

              {/* Drop Zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-[rgba(212,175,55,0.3)] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#D4AF37]/5 transition-colors mb-4"
              >
                <UploadCloud className="w-7 h-7 text-[#D4AF37]/60 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — Max 10 images</p>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((url, i) => (
                    <div key={i} className={`relative aspect-square rounded-lg border-2 overflow-hidden ${i === 0 ? 'border-[#D4AF37]' : 'border-gray-200 dark:border-white/10'}`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-sm flex items-center justify-center text-white">
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && <div className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] text-[#D4AF37] font-bold">MAIN</div>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Product Options */}
            <section className="bg-white/60 dark:bg-[#111827]/80 border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product Flags</h2>
              <div className="space-y-4">
                <Toggle value={form.isActive} onChange={v => set('isActive', v)} label="Active (visible in store)" />
                <Toggle value={form.isFeatured} onChange={v => set('isFeatured', v)} label="Featured Product" />
                <Toggle value={form.isNewArrival} onChange={v => set('isNewArrival', v)} label="New Arrival" />
                <Toggle value={form.isBestSeller} onChange={v => set('isBestSeller', v)} label="Best Seller" />
              </div>
            </section>

            {/* Status Card */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Ready to Publish</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Your product will go live immediately.</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-500" />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddProduct;
