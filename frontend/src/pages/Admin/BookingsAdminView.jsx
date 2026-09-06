import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Calendar, User, MapPin, DollarSign, RefreshCw, XCircle } from 'lucide-react';

export const BookingsAdminView = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getBookings(statusFilter ? { status: statusFilter } : {});
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceCancel = async (id) => {
    if (!window.confirm('Admin Action: Cancel this booking?')) return;
    try {
      const res = await bookingAPI.cancelBooking(id);
      if (res.success) fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Platform Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">Audit customer service requests, worker assignments, and payment statuses</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchBookings}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching platform bookings..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Bookings in Database"
          description="There are currently no bookings matching your criteria in the database."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-base">{b.skill_name || 'Service Job'}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Category: <strong>{b.category_name}</strong> | ID: #{b.id.substring(0, 8)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-emerald-600">${b.final_amount || b.estimated_amount}</div>
                  <div className="text-[11px] text-slate-400">Invoice Status: <StatusBadge status={b.invoice_status || 'unpaid'} /></div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>Customer: <strong>{b.customer_name}</strong> ({b.customer_phone || 'N/A'})</div>
                <div>Worker: <strong>{b.worker_name || 'Unassigned'}</strong></div>
                <div>Address: <strong>{b.service_address}</strong></div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Scheduled: {new Date(b.scheduled_time).toLocaleString()}</span>
                {['pending', 'accepted', 'in_progress'].includes(b.status) && (
                  <button
                    onClick={() => handleForceCancel(b.id)}
                    className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Force Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
