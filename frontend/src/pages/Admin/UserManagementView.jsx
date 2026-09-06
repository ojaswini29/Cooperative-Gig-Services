import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/endpoints';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Users, Search, RefreshCw, UserX, UserCheck, Shield } from 'lucide-react';

export const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;

      const res = await adminAPI.getUsers(params);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const res = await adminAPI.updateUserStatus(userId, { is_active: newStatus });
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Directory & Account Controls</h1>
          <p className="text-sm text-slate-500 mt-1">Manage accounts across customers, gig workers, and admins</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="gig_worker">Gig Worker</option>
            <option value="cooperative_admin">Coop Admin</option>
          </select>
          <button
            onClick={fetchUsers}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Users Found in Database"
          description="There are currently no users registered in the database matching your query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Registered Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800">{u.full_name}</td>
                    <td className="p-3.5 text-slate-600">{u.email}</td>
                    <td className="p-3.5 text-slate-600">{u.phone || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="p-3.5 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          u.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
