import { useState, useEffect, useRef } from 'react';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';
import Spinner from '@components/common/Spinner';

const ManageProducts = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Forms State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // Form Inputs
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [prodForm, setProdForm] = useState({ 
    name: '', description: '', price: '', discountPrice: '', 
    category: '', brand: '', stock: '', isFeatured: false 
  });
  const [imageFiles, setImageFiles] = useState([]);
  
  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAll({ limit: 100 }), // Admin fetch
        categoryService.getAll()
      ]);
      setProducts(prodRes.data.data.products);
      setCategories(catRes.data.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Category Handlers ─────────────────────────────────────
  const openCategoryModal = (cat = null) => {
    setEditData(cat);
    if (cat) {
      setCatForm({ name: cat.name, description: cat.description || '' });
    } else {
      setCatForm({ name: '', description: '' });
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editData) {
        await categoryService.update(editData._id, catForm);
      } else {
        await categoryService.create(catForm);
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryService.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting category');
    }
  };

  // ── Product Handlers ──────────────────────────────────────
  const openProductModal = (prod = null) => {
    setEditData(prod);
    if (prod) {
      setProdForm({ 
        name: prod.name, description: prod.description, price: prod.price, 
        discountPrice: prod.discountPrice || '', category: prod.category?._id || '', 
        brand: prod.brand || '', stock: prod.stock, isFeatured: prod.isFeatured 
      });
    } else {
      setProdForm({ 
        name: '', description: '', price: '', discountPrice: '', 
        category: categories.length > 0 ? categories[0]._id : '', 
        brand: '', stock: '', isFeatured: false 
      });
    }
    setImageFiles([]);
    setShowProductModal(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      let productId;
      
      const payload = { ...prodForm };
      if (!payload.discountPrice) delete payload.discountPrice;

      if (editData) {
        productId = editData._id;
        await productService.update(productId, payload);
      } else {
        const { data } = await productService.create(payload);
        productId = data.data._id;
      }

      // Handle Image Upload if files exist
      if (imageFiles.length > 0) {
        const formData = new FormData();
        Array.from(imageFiles).forEach(file => {
          formData.append('images', file);
        });
        await productService.uploadImages(productId, formData);
      }

      setShowProductModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productService.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product');
    }
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="section container-app animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="section-title mb-0">Catalog Management</h1>
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </div>
      </div>

      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      {/* ── Products Tab ── */}
      {activeTab === 'products' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Products ({products.length})</h2>
            <button onClick={() => openProductModal()} className="btn-primary text-sm px-4 py-2">+ Add Product</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod._id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <img src={prod.images?.[0]?.url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded object-cover" />
                      <span className="truncate max-w-[200px] block">{prod.name}</span>
                    </td>
                    <td className="px-6 py-4">₹{prod.price}</td>
                    <td className="px-6 py-4">{prod.stock}</td>
                    <td className="px-6 py-4">{prod.category?.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openProductModal(prod)} className="font-medium text-primary-600 hover:underline mr-4">Edit</button>
                      <button onClick={() => deleteProduct(prod._id)} className="font-medium text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-8 text-center">No products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Categories Tab ── */}
      {activeTab === 'categories' && (
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Categories ({categories.length})</h2>
            <button onClick={() => openCategoryModal()} className="btn-primary text-sm px-4 py-2">+ Add Category</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat._id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                    <td className="px-6 py-4">{cat.slug}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openCategoryModal(cat)} className="font-medium text-primary-600 hover:underline mr-4">Edit</button>
                      <button onClick={() => deleteCategory(cat._id)} className="font-medium text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan="3" className="px-6 py-8 text-center">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      
      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl animate-scale-in">
            <h3 className="text-xl font-bold mb-4">{editData ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={saveCategory} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input required type="text" className="input" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows="3" value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn">Cancel</button>
                <button type="submit" className="btn-primary px-6">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold mb-6">{editData ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={saveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Product Name</label>
                  <input required type="text" className="input" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} />
                </div>
                
                <div>
                  <label className="label">Price (₹)</label>
                  <input required type="number" min="0" className="input" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="label">Discount Price (₹)</label>
                  <input type="number" min="0" className="input" value={prodForm.discountPrice} onChange={e => setProdForm({...prodForm, discountPrice: e.target.value})} />
                </div>
                
                <div>
                  <label className="label">Category</label>
                  <select required className="input" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})}>
                    <option value="" disabled>Select category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Stock</label>
                  <input required type="number" min="0" className="input" value={prodForm.stock} onChange={e => setProdForm({...prodForm, stock: e.target.value})} />
                </div>
                
                <div className="col-span-2">
                  <label className="label">Brand</label>
                  <input type="text" className="input" value={prodForm.brand} onChange={e => setProdForm({...prodForm, brand: e.target.value})} />
                </div>
                
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea required className="input" rows="4" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})}></textarea>
                </div>

                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isFeatured" checked={prodForm.isFeatured} onChange={e => setProdForm({...prodForm, isFeatured: e.target.checked})} className="w-4 h-4 text-primary-600 rounded" />
                  <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300 font-medium">Featured Product</label>
                </div>

                <div className="col-span-2 border-t dark:border-gray-800 pt-4 mt-2">
                  <label className="label">Upload Images (Max 10)</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={e => setImageFiles(e.target.files)} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {editData?.images?.length > 0 && (
                    <div className="mt-3 text-sm text-gray-500">
                      Currently has {editData.images.length} image(s). Uploading new images will add to them.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-8 border-t dark:border-gray-800 pt-6">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn">Cancel</button>
                <button type="submit" className="btn-primary px-8">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageProducts;
