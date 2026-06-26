import { useState, useEffect } from 'react';
import { Star, Trash2, Search, MessageSquare, ExternalLink } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import api from '@services/api';

const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.data || []);
    } catch {
      alert('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const filtered = reviews.filter(r =>
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  const ratingColor = (r) => {
    if (r >= 4) return 'text-green-500 bg-green-500/10';
    if (r >= 3) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Reviews</h1>
            <p className="text-sm text-gray-500 mt-1">{reviews.length} total customer reviews</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 glass-panel rounded-full text-sm">
            <div className="flex items-center gap-1.5 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold">
                {reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '—'}
              </span>
            </div>
            <span className="text-gray-400">avg rating</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '5 Star', count: reviews.filter(r => r.rating === 5).length, color: 'text-green-500' },
            { label: '3-4 Star', count: reviews.filter(r => r.rating >= 3 && r.rating < 5).length, color: 'text-yellow-500' },
            { label: '1-2 Star', count: reviews.filter(r => r.rating < 3).length, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="glass-panel p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="glass-panel p-4 mb-6 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer, product or comment..."
            className="flex-1 bg-transparent text-[#111827] dark:text-[#F5F5F5] placeholder-gray-400 focus:outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Reviews Table */}
        <div className="glass-panel overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center text-gray-500">
              <MessageSquare className="w-10 h-10 mb-3 text-[#D4AF37]/30" />
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50 dark:divide-white/5">
              {filtered.map(review => (
                <div key={review._id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-bold uppercase text-sm shrink-0">
                        {review.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="font-semibold text-[#111827] dark:text-[#F5F5F5] text-sm">
                            {review.user?.name || 'Deleted User'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ratingColor(review.rating)}`}>
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-500/10">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        {review.title && (
                          <p className="text-sm font-medium text-[#111827] dark:text-[#F5F5F5] mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{review.comment}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>on <span className="text-[#D4AF37]">{review.product?.name || 'Unknown Product'}</span></span>
                          <span>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageReviews;
