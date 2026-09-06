import React, { useState, useEffect } from 'react';
import { workerAPI, ratingAPI } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';

export const WorkerRatingsView = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const profRes = await workerAPI.getProfile();
      if (profRes.success && profRes.data.id) {
        const ratingsRes = await ratingAPI.getWorkerRatings(profRes.data.id);
        if (ratingsRes.success) {
          setRatings(ratingsRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-800">Customer Ratings & Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">Feedback and rating scores submitted by customers for completed jobs</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching worker ratings..." />
      ) : ratings.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No Ratings Received Yet"
          description="You have not received any customer reviews yet in the database. Ratings will automatically appear here as customers complete jobs and leave reviews."
        />
      ) : (
        <div className="space-y-4">
          {ratings.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-800 text-sm">{r.reviewer_name || 'Customer'}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < r.score ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                  <span className="ml-1 text-slate-800">({r.score}.0)</span>
                </div>
              </div>

              {r.comment && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{r.comment}"
                </p>
              )}

              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Reviewed on {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
