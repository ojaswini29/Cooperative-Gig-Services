import React, { useState, useEffect } from 'react';
import { matchAPI } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Navigation, Star, Award, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export const WorkerMatchingModal = ({ isOpen, onClose, booking, onWorkerAssigned }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && booking) {
      fetchMatches();
    }
  }, [isOpen, booking]);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await matchAPI.scoreWorkers(booking.id);
      if (res.success) {
        setCandidates(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch candidate workers');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    setError('');
    try {
      const res = await matchAPI.autoAssign(booking.id);
      if (res.success) {
        onWorkerAssigned(res.data.booking);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Auto-assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Worker Geo-Matching & Smart Allocation" maxWidth="max-w-3xl">
      <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-700">Booking:</span> #{booking.id.substring(0, 8)} |{' '}
          <span className="font-bold text-slate-700">Service:</span> {booking.skill_name || 'Gig Skill'}
        </div>
        <button
          onClick={handleAutoAssign}
          disabled={assigning || candidates.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-white" />
          {assigning ? 'Assigning Best Match...' : 'Auto-Assign Top Worker'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Searching nearby verified workers & computing smart scores..." />
      ) : candidates.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-700">No Matching Workers Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There are currently no verified, available workers with this skill registered within distance range in the database.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ranked Candidate Workers ({candidates.length})
          </div>

          {candidates.map((worker, index) => (
            <div
              key={worker.worker_id}
              className={`p-4 rounded-xl border transition-all ${
                index === 0
                  ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Top Match
                    </span>
                  )}
                  <h4 className="font-bold text-slate-800 text-base">{worker.full_name}</h4>
                  <StatusBadge status={worker.insurance_status} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-emerald-600">
                    {worker.scores.total_score} <span className="text-xs font-normal text-slate-400">/ 100 Score</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                <div className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" />
                  <span>Distance: <strong>{worker.distance_km} km</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Rating: <strong>{worker.average_rating || 'New'} ⭐</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Jobs: <strong>{worker.completed_jobs_count} completed</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Rate: <strong>${worker.hourly_rate}/hr</strong></span>
                </div>
              </div>

              {/* Score Breakdown Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Proximity ({worker.scores.distance_score}%)</span>
                  <span>Rating ({worker.scores.rating_score}%)</span>
                  <span>Experience ({worker.scores.experience_score}%)</span>
                  <span>Welfare Bonus ({worker.scores.welfare_score}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${worker.scores.distance_score * 0.35}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${worker.scores.rating_score * 0.30}%` }} />
                  <div className="bg-indigo-500 h-full" style={{ width: `${worker.scores.experience_score * 0.20}%` }} />
                  <div className="bg-teal-500 h-full" style={{ width: `${worker.scores.welfare_score * 0.15}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
