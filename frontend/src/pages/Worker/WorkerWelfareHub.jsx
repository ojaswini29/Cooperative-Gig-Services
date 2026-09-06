import React, { useState, useEffect } from 'react';
import { welfareAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { LifeBuoy, ShieldCheck, PlusCircle, AlertCircle, CheckCircle2, FileText, HeartPulse } from 'lucide-react';

export const WorkerWelfareHub = () => {
  const [welfareData, setWelfareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [claimForm, setClaimForm] = useState({
    title: '',
    claim_type: 'health',
    description: '',
    amount_requested: 100,
  });

  useEffect(() => {
    fetchWelfare();
  }, []);

  const fetchWelfare = async () => {
    setLoading(true);
    try {
      const res = await welfareAPI.getWorkerWelfareStatus();
      if (res.success) {
        setWelfareData(res.data);
      }
    } catch (err) {
      console.error('Failed to load worker welfare details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaiming(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        title: claimForm.title,
        claim_type: claimForm.claim_type,
        description: claimForm.description,
        amount_requested: parseFloat(claimForm.amount_requested),
      };

      const res = await welfareAPI.submitClaim(payload);
      if (res.success) {
        setSuccessMsg('Welfare claim submitted successfully to Cooperative Admin!');
        setClaimForm({ title: '', claim_type: 'health', description: '', amount_requested: 100 });
        fetchWelfare();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit welfare claim');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching mutual welfare & insurance status..." />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-800">Cooperative Welfare & Insurance Protection</h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated safety net powered by 5% platform job contributions and mutual healthcare coverage
        </p>
      </div>

      {/* Insurance Status Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <StatusBadge status={welfareData?.insurance?.coverage_active ? 'active' : 'inactive'} />
          </div>
          <h3 className="text-xl font-bold mb-1">Mutual Health & Injury Protection</h3>
          <p className="text-xs text-slate-400 mb-4">{welfareData?.insurance?.provider}</p>

          <div className="space-y-2 text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="flex justify-between">
              <span>Policy Number:</span>
              <strong className="text-emerald-400">{welfareData?.insurance?.policy_number}</strong>
            </div>
            <div className="flex justify-between">
              <span>Active Worker Protection:</span>
              <strong className="text-white">Active Guarantee</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-4">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">My Cumulative Welfare Earnings</h3>
            <p className="text-xs text-slate-500 mb-4">
              5% from each of your completed job earnings is credited directly to your cooperative welfare fund ledger.
            </p>
          </div>

          <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 flex justify-between items-center">
            <div>
              <div className="text-xs text-teal-700 font-semibold">Total Fund Contribution</div>
              <div className="text-2xl font-black text-teal-800">
                ${welfareData?.welfare_contributions?.total_contributed || '0.00'}
              </div>
            </div>
            <div className="text-right text-xs text-teal-700">
              From <strong>{welfareData?.welfare_contributions?.completed_jobs_count || 0}</strong> completed jobs
            </div>
          </div>
        </div>
      </div>

      {/* Submit Welfare Claim Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-600" /> Submit Welfare Benefit / Injury Claim
        </h2>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Claim Title / Purpose</label>
              <input
                type="text"
                required
                value={claimForm.title}
                onChange={(e) => setClaimForm({ ...claimForm, title: e.target.value })}
                placeholder="e.g., Safety Helmet & Protective Boots Subsidy, Annual Health Check"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Claim Type</label>
              <select
                value={claimForm.claim_type}
                onChange={(e) => setClaimForm({ ...claimForm, claim_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="health">Health & Medical Check</option>
                <option value="injury">On-the-Job Injury</option>
                <option value="equipment">Safety Gear & Equipment</option>
                <option value="education">Skills Upskilling</option>
                <option value="emergency">Emergency Relief</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Description</label>
              <textarea
                rows={3}
                required
                value={claimForm.description}
                onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                placeholder="Provide medical receipts, purchase descriptions, or event context..."
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Requested Amount ($)</label>
              <input
                type="number"
                step="5"
                min="1"
                required
                value={claimForm.amount_requested}
                onChange={(e) => setClaimForm({ ...claimForm, amount_requested: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                disabled={claiming}
                className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                {claiming ? 'Submitting Claim...' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Claims History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" /> Submitted Welfare Claims ({welfareData?.claims?.length || 0})
        </h2>

        {!welfareData?.claims || welfareData.claims.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Welfare Claims Submitted"
            description="You have not submitted any welfare claims yet. Use the form above to submit your first claim."
          />
        ) : (
          <div className="space-y-3">
            {welfareData.claims.map((claim) => (
              <div key={claim.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-slate-800 text-base">{claim.title}</h4>
                    <StatusBadge status={claim.status} />
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{claim.description}</p>
                  <div className="text-[11px] text-slate-400">
                    Claim Type: <span className="font-semibold text-slate-600 uppercase">{claim.claim_type}</span> | Submitted: {new Date(claim.created_at).toLocaleDateString()}
                  </div>
                  {claim.admin_notes && (
                    <div className="mt-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      Admin Notes: "{claim.admin_notes}"
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-slate-800">${claim.amount_requested}</div>
                  <div className="text-xs text-emerald-600 font-semibold">
                    Approved: ${claim.amount_approved || 0.00}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
