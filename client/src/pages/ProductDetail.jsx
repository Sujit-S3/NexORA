import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '@services/productService';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import Spinner from '@components/common/Spinner';
import ProductReviews from '@components/product/ProductReviews';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await productService.getBySlug(slug);
      setProduct(data.data);
      if (data.data.images?.length > 0) {
        setMainImage(data.data.images[0].url);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/products/' + slug);
      return;
    }
    setAddingToCart(true);
    const result = await addToCart(product._id, 1);
    setAddingToCart(false);
    if (result.success) {
      // Could show a toast here. For now, navigate to cart
      navigate('/cart');
    } else {
      alert(result.message || 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="section container-app flex justify-center">
        <div className="card p-12 text-center max-w-lg border-red-200 bg-red-50 dark:bg-red-900/10">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Error</h2>
          <p className="text-red-500 mb-6">{error || 'Product not found'}</p>
          <Link to="/products" className="btn">Back to Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section container-app animate-fade-in">
      <div className="mb-6">
        <Link to="/products" className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1">
          <span>←</span> Back to Shop
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 relative">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
            )}
            {product.isFeatured && (
              <div className="absolute top-4 left-4 badge badge-primary shadow-lg">Featured</div>
            )}
          </div>
          
          {product.images?.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={img.publicId || idx}
                  onClick={() => setMainImage(img.url)}
                  className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    mainImage === img.url ? 'border-primary-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={`${product.name} thumbnail`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-bold text-primary-600 uppercase tracking-wider">
              {product.category?.name || 'Uncategorized'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{product.discountPrice || product.price}</span>
            {product.discountPrice && (
              <span className="text-xl text-gray-500 line-through mb-0.5">₹{product.price}</span>
            )}
          </div>

          <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-400 mb-8 max-w-none whitespace-pre-line">
            {product.description}
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Availability:</span>
              {product.stock > 0 ? (
                <span className="font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                  In Stock ({product.stock} units)
                </span>
              ) : (
                <span className="font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          <div className="mt-auto space-y-4 border-t border-gray-100 dark:border-gray-800 pt-8">
            <button 
              onClick={handleAddToCart}
              className="btn-primary w-full btn-lg shadow-glow flex justify-center items-center gap-2"
              disabled={product.stock <= 0 || addingToCart}
            >
              {addingToCart ? <Spinner size="sm" /> : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product._id} initialRatings={product.ratings} />

      {/* Related Products Placeholder */}
      <div className="mt-24 border-t border-gray-100 dark:border-gray-800 pt-16">
        <h2 className="text-2xl font-display font-bold mb-8">You might also like</h2>
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400 border-dashed">
          Related products section will be implemented in future phases.
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
