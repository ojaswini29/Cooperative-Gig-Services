import React, { useState, useEffect } from 'react';
import { workerAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ShieldAlert, CheckCircle2, XCircle, FileText, ExternalLink, RefreshCw } from 'lucide-react';

export const WorkerVerificationView = () => {
  const [workers, setWorkers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [notesInput, setNotesInput] = useState({});

  useEffect(() => {
    fetchPending();
  }, [statusFilter]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await workerAPI.getPendingWorkers(statusFilter);
      if (res.success) {
        setWorkers(res.data);
      }
    } catch (err) {
      console.error('Failed to load pending workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (workerId, newStatus) => {
    const notes = notesInput[workerId] || `Verification status changed to ${newStatus} by Cooperative Admin.`;
    setVerifyingId(workerId);
    try {
      const res = await workerAPI.verifyWorker(workerId, {
        status: newStatus,
        verification_notes: notes,
      });

      if (res.success) {
        fetchPending();
      }
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Worker Verification Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Audit gig worker applications, inspect identity documents, and update verification status</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          {['pending', 'verified', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching workers..." />
      ) : workers.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={`No ${statusFilter.toUpperCase()} Workers Found`}
          description={`There are currently no worker profiles in the database matching status '${statusFilter}'. Registered workers will appear here.`}
        />
      ) : (
        <div className="space-y-4">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{worker.full_name}</h3>
                    <StatusBadge status={worker.verification_status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Email: <strong>{worker.email}</strong> | Phone: <strong>{worker.phone || 'N/A'}</strong>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  Registered: {new Date(worker.created_at).toLocaleDateString()}
                </div>
              </div>

              {worker.bio && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Bio: "{worker.bio}"
                </p>
              )}

              <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>Operating Address: <strong>{worker.address || 'Not specified'}</strong></div>
                <div>Vehicle: <strong>{worker.vehicle_type || 'None'}</strong></div>
                <div>Insurance Policy: <strong>{worker.insurance_policy_number || 'N/A'}</strong></div>
              </div>

              {worker.identity_document_url && (
                <div className="text-xs">
                  <a
                    href={worker.identity_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" /> Inspect Submitted Identity Document
                  </a>
                </div>
              )}

              {/* Action Controls */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Verification Notes</label>
                  <input
                    type="text"
                    value={notesInput[worker.id] || worker.verification_notes || ''}
                    onChange={(e) => setNotesInput({ ...notesInput, [worker.id]: e.target.value })}
                    placeholder="Enter audit notes or rejection rationale..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleVerify(worker.id, 'rejected')}
                    disabled={verifyingId === worker.id}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject Worker
                  </button>

                  <button
                    onClick={() => handleVerify(worker.id, 'verified')}
                    disabled={verifyingId === worker.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Verify
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
