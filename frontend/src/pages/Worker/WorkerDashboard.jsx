import React, { useState, useEffect } from 'react';
import { workerAPI, jobAPI, welfareAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ShieldCheck, MapPin, Star, Award, CheckCircle, LifeBuoy, ToggleLeft, ToggleRight, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const WorkerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [welfare, setWelfare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const profRes = await workerAPI.getProfile();
      if (profRes.success) setProfile(profRes.data);

      const jobsRes = await jobAPI.getMyJobs();
      if (jobsRes.success) setJobs(jobsRes.data);

      const welfareRes = await welfareAPI.getWorkerWelfareStatus();
      if (welfareRes.success) setWelfare(welfareRes.data);
    } catch (err) {
      console.error('Error fetching worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setTogglingAvailability(true);
    try {
      const newStatus = !profile.is_available;
      const res = await workerAPI.updateLocation({
        latitude: profile.latitude || 18.5204,
        longitude: profile.longitude || 73.8567,
        is_available: newStatus,
      });
      if (res.success) {
        setProfile({ ...profile, is_available: newStatus });
      }
    } catch (err) {
      alert(err.message || 'Failed to update availability status');
    } finally {
      setTogglingAvailability(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading worker portal dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header & Verification Status Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{profile?.full_name || 'Gig Worker'}</h1>
              <StatusBadge status={profile?.verification_status || 'pending'} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cooperative ID: #{profile?.id ? profile.id.substring(0, 8).toUpperCase() : 'N/A'} | Insurance Policy:{' '}
              <span className="text-emerald-400 font-semibold">{welfare?.insurance?.policy_number}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvailability}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                profile?.is_available
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {profile?.is_available ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-300" /> Available for Jobs
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-400" /> Offline / Unavailable
                </>
              )}
            </button>
          </div>
        </div>

        {profile?.verification_status === 'pending' && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            Your worker verification request is currently under review by Cooperative Admin. You can still set up your skills and documents.
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Average Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{profile?.average_rating || '0.00'} ⭐</div>
          <div className="text-[11px] text-slate-400 mt-1">{profile?.total_ratings || 0} reviews received</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Completed Jobs</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{profile?.completed_jobs_count || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total jobs fulfilled</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Welfare Fund Earned</span>
            <LifeBuoy className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            ${welfare?.welfare_contributions?.total_contributed || '0.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">5% job co-op contribution</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Skills Registered</span>
            <CheckCircle className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{profile?.skills?.length || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active service offerings</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/worker/jobs"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-lg">Job Requests</h3>
            <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500">
            View pending service bookings matched to your skills, accept job requests, and complete active jobs.
          </p>
        </Link>

        <Link
          to="/worker/skills"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-lg">Skills & Hourly Rates</h3>
            <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500">
            Manage your service capabilities, set custom hourly pricing, and update experience years.
          </p>
        </Link>

        <Link
          to="/worker/welfare"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-lg">Welfare & Insurance</h3>
            <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500">
            Check active health/disability insurance coverage, submit claims for health or equipment subsidies, and track payouts.
          </p>
        </Link>
      </div>
    </div>
  );
};
