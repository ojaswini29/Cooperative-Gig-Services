import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CheckCircle2, Play, CheckSquare, Calendar, MapPin, Phone, User, AlertCircle, RefreshCw } from 'lucide-react';

export const WorkerJobsView = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualHoursInput, setActualHoursInput] = useState({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await jobAPI.getMyJobs();
      if (res.success) {
        setJobs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (bookingId) => {
    try {
      const res = await jobAPI.acceptJob(bookingId);
      if (res.success) {
        fetchJobs();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept job');
    }
  };

  const handleStartJob = async (bookingId) => {
    try {
      const res = await jobAPI.startJob(bookingId);
      if (res.success) {
        fetchJobs();
      }
    } catch (err) {
      alert(err.message || 'Failed to start job');
    }
  };

  const handleCompleteJob = async (bookingId) => {
    const hours = actualHoursInput[bookingId] || 1.0;
    try {
      const res = await jobAPI.completeJob(bookingId, { actual_hours: parseFloat(hours) });
      if (res.success) {
        alert('Job marked completed! Invoice generated with 10% coop fee and 5% welfare contribution.');
        fetchJobs();
      }
    } catch (err) {
      alert(err.message || 'Failed to complete job');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Job Requests & Active Work</h1>
          <p className="text-sm text-slate-500 mt-1">Accept incoming service requests, execute jobs, and record completed hours</p>
        </div>
        <button
          onClick={fetchJobs}
          className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Jobs
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching job requests..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Job Requests Found"
          description="There are currently no job bookings assigned to you in the database. When customers place bookings for your skills, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{job.skill_name || 'Service Job'}</h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Category: <strong>{job.category_name}</strong> | Job ID: #{job.id.substring(0, 8)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-600">${job.final_amount || job.estimated_amount}</div>
                  <div className="text-xs text-slate-400">${job.hourly_rate}/hr ({job.actual_hours || job.estimated_hours} hrs)</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Customer: <strong>{job.customer_name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Phone: <strong>{job.customer_phone || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">Address: <strong>{job.service_address}</strong></span>
                </div>
              </div>

              {job.notes && (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                  Customer Notes: "{job.notes}"
                </div>
              )}

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Scheduled Time: {new Date(job.scheduled_time).toLocaleString()}
                </div>

                <div className="flex items-center gap-2">
                  {job.status === 'pending' && (
                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept Job Request
                    </button>
                  )}

                  {job.status === 'accepted' && (
                    <button
                      onClick={() => handleStartJob(job.id)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Job Execution
                    </button>
                  )}

                  {job.status === 'in_progress' && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                        <label className="text-[11px] font-bold text-slate-600">Actual Hours:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={actualHoursInput[job.id] || job.estimated_hours}
                          onChange={(e) => setActualHoursInput({ ...actualHoursInput, [job.id]: e.target.value })}
                          className="w-16 px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded text-center outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleCompleteJob(job.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckSquare className="w-4 h-4" /> Complete & Generate Invoice
                      </button>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      ✓ Job Completed & Invoice Paid/Unpaid Status: {job.invoice_status || 'Generated'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
