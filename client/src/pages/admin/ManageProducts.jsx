import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Star, TrendingUp, Sparkles, Package, Filter } from 'lucide-react';
import { productService } from '@services/productService';
import Spinner from '@components/common/Spinner';

const ManageProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFlag, setFilterFlag] = useState('all');
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getAll({ limit: 200 });
      setProducts(res.data.data.products || []);
    } catch {
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this product?')) return;
    try {
      await productService.delete(id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFlag =
      filterFlag === 'all' ? true :
      filterFlag === 'featured' ? p.isFeatured :
      filterFlag === 'newArrival' ? p.isNewArrival :
      filterFlag === 'bestSeller' ? p.isBestSeller :
      filterFlag === 'lowStock' ? p.stock < 10 : true;
    return matchSearch && matchFlag;
  });

  const stats = {
    total: products.length,
    featured: products.filter(p => p.isFeatured).length,
    bestSellers: products.filter(p => p.isBestSeller).length,
    lowStock: products.filter(p => p.stock < 10).length,
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-transparent"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Products</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} products in your catalog</p>
          </div>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium shadow-lg hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Package, flag: 'all', color: 'text-gray-500' },
            { label: 'Featured', value: stats.featured, icon: Sparkles, flag: 'featured', color: 'text-[#D4AF37]' },
            { label: 'Best Sellers', value: stats.bestSellers, icon: TrendingUp, flag: 'bestSeller', color: 'text-green-500' },
            { label: 'Low Stock', value: stats.lowStock, icon: Star, flag: 'lowStock', color: 'text-red-500' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <button key={s.flag} onClick={() => setFilterFlag(s.flag)}
                className={`glass-panel p-4 text-left transition-all hover:border-[#D4AF37]/30 ${filterFlag === s.flag ? 'border border-[#D4AF37]/40' : 'border border-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">{s.value}</span>
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="glass-panel p-4 mb-5 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, brand or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[#111827] dark:text-[#F5F5F5] placeholder-gray-400 focus:outline-none text-sm"
          />
          {search && (
            <span className="text-xs text-gray-400">{filtered.length} results</span>
          )}
        </div>

        {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        {/* Table */}
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-[#D4AF37]/10 dark:bg-white/5 text-[#D4AF37]">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Flags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(prod => (
                  <tr key={prod._id} className="border-b border-gray-200/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors group">
                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                          {prod.images?.[0]?.url
                            ? <img src={prod.images[0].url} alt={prod.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#111827] dark:text-[#F5F5F5] truncate max-w-[200px]">{prod.name}</p>
                          <p className="text-xs text-gray-400">{prod.brand || '—'}</p>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {prod.category?.name || '—'}
                    </td>
                    {/* Price */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-[#111827] dark:text-[#F5F5F5]">₹{prod.discountPrice?.toLocaleString('en-IN') || prod.price?.toLocaleString('en-IN')}</p>
                        {prod.discountPrice && <p className="text-xs text-gray-400 line-through">₹{prod.price?.toLocaleString('en-IN')}</p>}
                      </div>
                    </td>
                    {/* Stock */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${prod.stock < 5 ? 'text-red-500 bg-red-500/10' : prod.stock < 15 ? 'text-yellow-600 bg-yellow-500/10' : 'text-green-600 bg-green-500/10'}`}>
                        {prod.stock} units
                      </span>
                    </td>
                    {/* Flags */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {prod.isFeatured && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#D4AF37]/10 text-[#D4AF37]">★ Featured</span>}
                        {prod.isNewArrival && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-500">New</span>}
                        {prod.isBestSeller && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-500/10 text-green-500">🔥 Best</span>}
                        {!prod.isActive && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-400/10 text-gray-400">Draft</span>}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/admin/products/edit/${prod._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(prod._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500">No products found. <button onClick={() => navigate('/admin/products/new')} className="text-[#D4AF37] hover:underline">Add your first product</button></p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageProducts;
