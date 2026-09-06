import React, { useState } from 'react';
import { ratingAPI } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
import { Star, AlertCircle } from 'lucide-react';

export const RatingModal = ({ isOpen, onClose, booking, onRatingSubmitted }) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        booking_id: booking.id,
        score: parseInt(score),
        comment,
      };

      const res = await ratingAPI.createRating(payload);
      if (res.success) {
        if (onRatingSubmitted) onRatingSubmitted(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Worker & Service">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Overall Score Rating</label>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setScore(star)}
                className="p-1 hover:scale-110 transition-transform cursor-pointer"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= score ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-sm font-bold text-amber-600 mt-1">{score} out of 5 Stars</div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Feedback / Review Comment</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working with this gig worker..."
            className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Submitting Rating...' : 'Submit Rating & Review'}
        </button>
      </form>
    </Modal>
  );
};
