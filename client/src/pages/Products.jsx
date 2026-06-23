import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';
import Spinner from '@components/common/Spinner';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters from URL
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoryService.getAll();
        setCategories(data.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await productService.getAll({ keyword, category, sort, page });
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [keyword, category, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handlers
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset page on filter change
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  return (
    <div className="section container-app animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Shop All Products</h1>
          <p className="text-gray-500">Discover our collection of premium items.</p>
        </div>
        
        {/* Search & Sort Controls */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            className="input w-full md:w-64"
            value={keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
          <select 
            className="input w-full md:w-48"
            value={sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="">Sort by: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="top_rated">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar: Categories */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 uppercase text-sm tracking-wider">Categories</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <button
                    onClick={() => handleFilterChange('category', cat._id)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat._id ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content: Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-500">Loading products...</p>
            </div>
          ) : error ? (
            <div className="card p-8 text-center border-red-200 bg-red-50 dark:bg-red-900/10">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button onClick={fetchProducts} className="btn mt-4">Try Again</button>
            </div>
          ) : products.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search query.</p>
              <button onClick={() => setSearchParams({})} className="btn-primary">Clear All Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link to={`/products/${product.slug}`} key={product._id} className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 flex flex-col overflow-hidden">
                    <div className="aspect-[4/5] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      {product.images?.[0] ? (
                        <img 
                          src={product.images[0].url} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      {product.isFeatured && (
                        <div className="absolute top-3 left-3 badge badge-primary shadow-lg">Featured</div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category?.name || 'Uncategorized'}</p>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-auto pt-2 flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900 dark:text-white">₹{product.price}</span>
                        {product.discountPrice && (
                          <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="btn px-4 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => handlePageChange(num)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        num === pagination.page 
                          ? 'bg-primary-600 text-white shadow-glow' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="btn px-4 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
