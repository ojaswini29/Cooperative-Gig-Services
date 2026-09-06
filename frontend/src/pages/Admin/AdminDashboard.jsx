import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Users, ShieldAlert, Calendar, DollarSign, LifeBuoy, Wrench, RefreshCw, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Cooperative Admin Dashboard..." />;

  const grossRev = stats?.financials?.gross_revenue || '0.00';
  const coopFees = stats?.financials?.total_coop_fees || '0.00';
  const netWelfare = stats?.financials?.net_welfare_fund_balance || 0.00;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-2xl font-bold">Cooperative Admin Control Panel</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform metrics, financial ledgers, worker verification, and AI demand analytics
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Stats
        </button>
      </div>

      {/* Top Financial & Platform KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Gross Booking Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">${grossRev}</div>
          <div className="text-[11px] text-slate-400 mt-1">Paid customer bookings</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Co-op Revenue (10%)</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">${coopFees}</div>
          <div className="text-[11px] text-slate-400 mt-1">Platform operations fee</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Welfare Fund Balance</span>
            <LifeBuoy className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">${netWelfare.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Worker safety & health fund</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase">Service Catalog</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {stats?.catalog?.categories_count || 0} <span className="text-xs font-normal text-slate-400">Categories</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{stats?.catalog?.skills_count || 0} total skills</div>
        </div>
      </div>

      {/* User & Worker Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Platform Users Breakdown
          </h3>
          <div className="space-y-2">
            {stats?.user_distribution?.length === 0 ? (
              <p className="text-xs text-slate-400">No users in database.</p>
            ) : (
              stats?.user_distribution?.map((u) => (
                <div key={u.role} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 capitalize">{u.role.replace('_', ' ')}s</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">{u.count} registered</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Gig Worker Verification Pipeline
          </h3>
          <div className="space-y-2">
            {stats?.worker_verifications?.length === 0 ? (
              <p className="text-xs text-slate-400">No worker profiles in database.</p>
            ) : (
              stats?.worker_verifications?.map((w) => (
                <div key={w.verification_status} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <StatusBadge status={w.verification_status} />
                  <span className="font-bold text-slate-800">{w.count} workers</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/admin/verifications" className="text-xs font-bold text-emerald-600 hover:underline">
              Open Verification Queue →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/verifications" className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all">
          <ShieldAlert className="w-6 h-6 text-amber-500 mb-2" />
          <h4 className="font-bold text-slate-800 text-sm">Worker Verifications</h4>
          <p className="text-xs text-slate-500 mt-1">Review applicant documents and grant verification status</p>
        </Link>

        <Link to="/admin/catalog" className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all">
          <Wrench className="w-6 h-6 text-emerald-600 mb-2" />
          <h4 className="font-bold text-slate-800 text-sm">Service Catalog</h4>
          <p className="text-xs text-slate-500 mt-1">Manage categories, skills, and base hourly rate standards</p>
        </Link>

        <Link to="/admin/forecasting" className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all">
          <TrendingUp className="w-6 h-6 text-teal-600 mb-2" />
          <h4 className="font-bold text-slate-800 text-sm">AI Demand Forecasting</h4>
          <p className="text-xs text-slate-500 mt-1">Inspect ML demand features and time-series surge projections</p>
        </Link>
      </div>
    </div>
  );
};
