import React, { useState, useEffect } from 'react';
import { welfareAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { LifeBuoy, CheckCircle2, XCircle, DollarSign, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

export const WelfareAdminLedger = () => {
  const [summary, setSummary] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  useEffect(() => {
    fetchWelfareData();
  }, []);

  const fetchWelfareData = async () => {
    setLoading(true);
    try {
      const sumRes = await welfareAPI.getWelfareSummary();
      if (sumRes.success) setSummary(sumRes.data);

      const claimsRes = await welfareAPI.getClaims();
      if (claimsRes.success) setClaims(claimsRes.data);
    } catch (err) {
      console.error('Failed to load welfare ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClaim = async (claimId, newStatus) => {
    const notes = adminNotes[claimId] || `Status updated to ${newStatus} by Cooperative Admin.`;
    setUpdatingId(claimId);
    try {
      const res = await welfareAPI.updateClaimStatus(claimId, {
        status: newStatus,
        admin_notes: notes,
      });

      if (res.success) {
        fetchWelfareData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update claim');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Fetching cooperative welfare fund ledger..." />;

  const fund = summary?.fund_ledger || {};

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <h1 className="text-2xl font-bold">Cooperative Welfare & Protection Fund Ledger</h1>
        <p className="text-xs text-slate-400 mt-1">
          Centralized treasury ledger populated by 5% platform job fees to fund worker medical, safety, and injury benefits
        </p>
      </div>

      {/* Treasury Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Fee Credits Collected</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">${fund.total_contributions_collected || '0.00'}</div>
          <div className="text-[11px] text-slate-400 mt-1">Accumulated 5% job contributions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Claims Paid Out</div>
          <div className="text-2xl font-black text-rose-600 mt-1">${fund.total_payouts_distributed || '0.00'}</div>
          <div className="text-[11px] text-slate-400 mt-1">Benefit distributions to workers</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase">Net Fund Treasury Balance</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">${fund.net_fund_balance || '0.00'}</div>
          <div className="text-[11px] text-slate-400 mt-1">Available for worker claims</div>
        </div>
      </div>

      {/* Claims Audit Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" /> Worker Benefit Claims ({claims.length})
        </h2>

        {claims.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No Welfare Claims in Database"
            description="There are currently no worker welfare claims submitted in the database."
          />
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-800 text-base">{claim.title}</h3>
                      <StatusBadge status={claim.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Worker: <strong>{claim.worker_name}</strong> ({claim.worker_email}) | Type:{' '}
                      <span className="font-semibold text-slate-600 uppercase">{claim.claim_type}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-slate-800">${claim.amount_requested}</div>
                    <div className="text-xs text-emerald-600 font-semibold">
                      Approved: ${claim.amount_approved || 0.00}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  Description: "{claim.description}"
                </p>

                {claim.status === 'pending' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <input
                      type="text"
                      value={adminNotes[claim.id] || ''}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [claim.id]: e.target.value })}
                      placeholder="Admin audit notes / payout rationale..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateClaim(claim.id, 'rejected')}
                        disabled={updatingId === claim.id}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject Claim
                      </button>

                      <button
                        onClick={() => handleUpdateClaim(claim.id, 'paid_out')}
                        disabled={updatingId === claim.id}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Disburse Payout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
