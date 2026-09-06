import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';

export const InvoicePaymentModal = ({ isOpen, onClose, bookingId, onPaymentComplete }) => {
  const [invoice, setInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('coop_wallet');
  const [txnRef, setTxnRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchInvoice();
    }
  }, [isOpen, bookingId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError('');
    setReceipt(null);
    try {
      const res = await paymentAPI.getInvoiceByBooking(bookingId);
      if (res.success) {
        setInvoice(res.data);
      }
    } catch (err) {
      setError(err.message || 'Invoice not yet generated for this booking');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    setPaying(true);
    setError('');

    try {
      const payload = {
        invoice_id: invoice.id,
        payment_method: paymentMethod,
        transaction_reference: txnRef || `MOCK_TXN_${Date.now()}`,
      };

      const res = await paymentAPI.processPayment(payload);
      if (res.success) {
        setInvoice(res.data.invoice);
        setReceipt(res.data.receipt);
        if (onPaymentComplete) onPaymentComplete(res.data.invoice);
      }
    } catch (err) {
      setError(err.message || 'Mock payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Service Invoice & Cooperative Payment">
      {loading ? (
        <LoadingSpinner message="Fetching invoice details..." />
      ) : error && !invoice ? (
        <div className="p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-800">Invoice Pending</h4>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
      ) : invoice ? (
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Invoice Number</div>
              <div className="text-lg font-bold">#{invoice.id.substring(0, 13).toUpperCase()}</div>
              <div className="text-xs text-slate-400 mt-1">Booking: #{bookingId.substring(0, 8)}</div>
            </div>
            <div className="text-right">
              <StatusBadge status={invoice.status} />
              <div className="text-2xl font-black text-emerald-400 mt-1">${invoice.amount_total}</div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
            <div className="font-bold text-slate-800 border-b border-slate-200 pb-2">Itemized Breakdown</div>
            <div className="flex justify-between text-slate-600">
              <span>Service Subtotal ({invoice.actual_hours || '1.0'} hrs)</span>
              <span className="font-semibold">${invoice.amount_subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Platform Fee (10% Co-op)
              </span>
              <span>${invoice.coop_fee_amount}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Dedicated Worker Welfare Fund (5%)
              </span>
              <span className="text-emerald-700 font-bold">${invoice.welfare_contribution_amount}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-base">
              <span>Total Amount Payable</span>
              <span className="text-emerald-600">${invoice.amount_total}</span>
            </div>
          </div>

          {receipt ? (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-emerald-900 text-lg">Mock Payment Successful!</h4>
              <p className="text-xs text-emerald-700 mt-1">Transaction Ref: {receipt.transaction_reference}</p>
              <div className="mt-4 pt-3 border-t border-emerald-200/60 text-xs text-emerald-800 font-medium">
                ${receipt.coop_welfare_fund_portion} credited to the Worker Welfare & Protection Fund.
              </div>
            </div>
          ) : invoice.status === 'paid' ? (
            <div className="bg-slate-100 p-4 rounded-xl text-center text-xs font-semibold text-slate-600">
              This invoice has already been fully paid on {new Date(invoice.paid_at).toLocaleString()}.
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'coop_wallet', label: 'Cooperative Wallet' },
                    { id: 'upi', label: 'UPI Instant Pay' },
                    { id: 'credit_card', label: 'Credit / Debit Card' },
                    { id: 'bank_transfer', label: 'Direct Bank Transfer' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 text-xs font-semibold rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Reference (Optional)</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="e.g., MOCK_PAY_98765"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={paying}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                {paying ? 'Processing Mock Payment...' : `Pay $${invoice.amount_total} Now`}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
