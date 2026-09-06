import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CreateBookingModal } from './CreateBookingModal';
import { WorkerMatchingModal } from './WorkerMatchingModal';
import { InvoicePaymentModal } from './InvoicePaymentModal';
import { RatingModal } from './RatingModal';
import { Calendar, PlusCircle, Search, MapPin, DollarSign, Star, Zap, CreditCard, RefreshCw } from 'lucide-react';

export const CustomerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [matchingBooking, setMatchingBooking] = useState(null);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingAPI.getBookings();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch customer bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingCreated = (newBooking) => {
    setBookings([newBooking, ...bookings]);
    fetchBookings();
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await bookingAPI.cancelBooking(id);
      if (res.success) {
        fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Book services, match workers, and manage payments</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" /> Book New Service
        </button>
      </div>

      {/* Bookings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" /> My Service Bookings ({bookings.length})
          </h2>
          <button
            onClick={fetchBookings}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh bookings list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching your bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Active Service Bookings"
            description="Your database is currently empty. You can create your first booking request using the button below."
            actionLabel="Book a Service Now"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-800 text-lg">{booking.skill_name || 'Service Skill'}</h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Category: <span className="font-semibold text-slate-600">{booking.category_name}</span> | ID: #{booking.id.substring(0, 8)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-600">${booking.final_amount || booking.estimated_amount}</div>
                    <div className="text-xs text-slate-400">${booking.hourly_rate}/hr ({booking.actual_hours || booking.estimated_hours} hrs)</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Address: <strong>{booking.service_address}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Scheduled: <strong>{new Date(booking.scheduled_time).toLocaleString()}</strong></span>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-slate-500 italic mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{booking.notes}"
                  </p>
                )}

                {/* Worker Details & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    Worker:{' '}
                    {booking.worker_name ? (
                      <span className="font-bold text-slate-800">{booking.worker_name} ({booking.worker_phone || 'N/A'})</span>
                    ) : (
                      <span className="text-amber-600 font-semibold italic">Unassigned (Awaiting Match)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setMatchingBooking(booking)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" /> Match & Allocate Worker
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {booking.status === 'completed' && (
                      <>
                        <button
                          onClick={() => setPaymentBooking(booking)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                            booking.invoice_status === 'paid'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {booking.invoice_status === 'paid' ? 'View Paid Receipt' : 'Pay Invoice'}
                        </button>

                        <button
                          onClick={() => setRatingBooking(booking)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" /> Rate Worker
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onBookingCreated={handleBookingCreated}
      />

      {matchingBooking && (
        <WorkerMatchingModal
          isOpen={!!matchingBooking}
          onClose={() => setMatchingBooking(null)}
          booking={matchingBooking}
          onWorkerAssigned={fetchBookings}
        />
      )}

      {paymentBooking && (
        <InvoicePaymentModal
          isOpen={!!paymentBooking}
          onClose={() => setPaymentBooking(null)}
          bookingId={paymentBooking.id}
          onPaymentComplete={fetchBookings}
        />
      )}

      {ratingBooking && (
        <RatingModal
          isOpen={!!ratingBooking}
          onClose={() => setRatingBooking(null)}
          booking={ratingBooking}
          onRatingSubmitted={fetchBookings}
        />
      )}
    </div>
  );
};
