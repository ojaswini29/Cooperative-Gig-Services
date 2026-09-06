import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Wrench, LifeBuoy, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield className="w-4 h-4" /> Official Government & Cooperative Framework
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Fair Gig Services with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Cooperative Welfare & Protection
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Connecting customers with verified, skilled gig workers under a cooperative model that guarantees 
            fair wages, automated worker health & safety insurance, smart AI allocation, and transparent service.
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
              >
                Get Started / Register <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center text-base"
              >
                Sign In to Portal
              </Link>
            </div>
          ) : (
            <Link
              to={
                user.role === 'customer'
                  ? '/customer/dashboard'
                  : user.role === 'gig_worker'
                  ? '/worker/dashboard'
                  : '/admin/dashboard'
              }
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-lg transition-all"
            >
              Enter Your Portal ({user.role.replace('_', ' ')}) <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Cooperative Platform Architecture</h2>
          <p className="text-slate-600 mt-2">Built for workers, customers, and cooperative administration</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Customer Portal</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Browse categories, create location-based bookings, match nearby verified workers, track progress, process payments, and leave ratings.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Haversine Geo Matching</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Smart Multi-Factor Worker Allocation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Itemized Invoice & Mock Wallet</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Gig Worker Portal</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Register profiles, submit verification documents, set skills & hourly rates, accept job requests, complete jobs, and access welfare benefits.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Identity & Verification Badging</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> 5% Automated Welfare Fund Accumulation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Insurance & Injury Claims Hub</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 font-bold">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Cooperative Admin</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Overview platform metrics, verify worker applications, manage catalog skills, review welfare fund ledgers, and leverage AI demand forecasting.
            </p>
            <ul className="text-xs text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Worker Verification & Audit Queue</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Mutual Welfare Ledger & Payout Approval</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> AI-Ready ML Demand Vectors</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
