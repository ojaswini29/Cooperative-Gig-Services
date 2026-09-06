import React from 'react';
import { Database, Inbox, PlusCircle } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Records Found',
  description = 'There is currently no data in the database. As per system policy, demo/seed data is omitted. You can add new entries using the actions below.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs my-4 max-w-2xl mx-auto">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
