import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { reviewService } from '@services/reviewService';
import Spinner from '@components/common/Spinner';

// Star Rating Component
const StarRating = ({ rating, setRating, readOnly = true }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && setRating(star)}
          disabled={readOnly}
          className={`focus:outline-none transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <svg 
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, initialRatings }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Editing State
  const [editingReviewId, setEditingReviewId] = useState(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await reviewService.getProductReviews(productId);
      setReviews(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      if (editingReviewId) {
        await reviewService.editReview(editingReviewId, { rating, title, comment });
      } else {
        await reviewService.addReview(productId, { rating, title, comment });
      }
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      setEditingReviewId(null);
      
      // Refresh list
      await fetchReviews();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review._id);
    setRating(review.rating);
    setTitle(review.title || '');
    setComment(review.comment);
    // scroll to form
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      await fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setRating(5);
    setTitle('');
    setComment('');
  };

  // Derive if current user has already reviewed
  const userHasReviewed = isAuthenticated && reviews.some(r => r.user?._id === user?._id);

  if (isLoading) return <div className="py-8 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="mt-16 animate-fade-in" id="reviews-section">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
        Customer Reviews
      </h2>

      {error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left: Summary & Form */}
          <div className="lg:col-span-1 space-y-8">
            {/* Overall Rating */}
            <div className="card p-6 text-center">
              <div className="text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">
                {initialRatings?.average?.toFixed(1) || '0.0'}
              </div>
              <div className="flex justify-center mb-2">
                <StarRating rating={Math.round(initialRatings?.average || 0)} />
              </div>
              <p className="text-gray-500 text-sm">Based on {reviews.length} review(s)</p>
            </div>

            {/* Write Review Form */}
            {isAuthenticated ? (
              (!userHasReviewed || editingReviewId) ? (
                <div className="card p-6" id="review-form">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  {formError && <div className="p-3 mb-4 text-sm bg-red-50 text-red-600 rounded-lg">{formError}</div>}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="label mb-2">Overall Rating</label>
                      <StarRating rating={rating} setRating={setRating} readOnly={false} />
                    </div>
                    <div>
                      <label className="label">Title (Optional)</label>
                      <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarize your thoughts" maxLength={100} />
                    </div>
                    <div>
                      <label className="label">Review Comment *</label>
                      <textarea required className="input min-h-[100px]" value={comment} onChange={e => setComment(e.target.value)} placeholder="What did you like or dislike?" maxLength={1000} />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                        {isSubmitting ? 'Saving...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                      </button>
                      {editingReviewId && (
                        <button type="button" onClick={cancelEdit} className="btn">Cancel</button>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="card p-6 text-center bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">You have already reviewed this product.</p>
                </div>
              )
            ) : (
              <div className="card p-6 text-center bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-gray-900 dark:text-white font-medium mb-2">Want to review this product?</h3>
                <p className="text-gray-500 text-sm mb-4">You must be logged in and have purchased this item to leave a review.</p>
              </div>
            )}
          </div>

          {/* Right: Review List */}
          <div className="lg:col-span-2">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
                No reviews yet. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review._id} className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 font-bold uppercase shrink-0">
                          {review.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {review.user?.name || 'Unknown User'}
                            {review.isVerifiedPurchase && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">Verified</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {isAuthenticated && user?._id === review.user?._id && (
                          <div className="flex gap-2 mr-4">
                            <button onClick={() => handleEditClick(review)} className="text-xs text-blue-500 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(review._id)} className="text-xs text-red-500 hover:underline">Delete</button>
                          </div>
                        )}
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    {review.title && <h4 className="font-bold text-gray-900 dark:text-white mt-3 text-sm">{review.title}</h4>}
                    <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
