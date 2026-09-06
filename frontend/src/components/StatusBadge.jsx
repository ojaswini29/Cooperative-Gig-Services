import React from 'react';

export const StatusBadge = ({ status, type = 'generic' }) => {
  const normalized = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['verified', 'completed', 'paid', 'approved', 'active', 'paid_out'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['pending', 'accepted', 'in_progress', 'unpaid'].includes(normalized)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['rejected', 'cancelled', 'inactive', 'suspended', 'refunded'].includes(normalized)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const label = (status || 'unknown').replace(/_/g, ' ').toUpperCase();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      {label}
    </span>
  );
};
