import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Calendar,
  CheckCircle,
  ShieldAlert,
  Wrench,
  DollarSign,
  Star,
  Activity,
  Users,
  TrendingUp,
  FileCheck,
  LifeBuoy,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const customerLinks = [
    { to: '/customer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/customer/services', label: 'Browse Services', icon: Search },
    { to: '/customer/bookings', label: 'My Bookings', icon: Calendar },
  ];

  const workerLinks = [
    { to: '/worker/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/worker/profile', label: 'Profile & Documents', icon: FileCheck },
    { to: '/worker/skills', label: 'My Skills & Rates', icon: Wrench },
    { to: '/worker/jobs', label: 'Job Requests & Active', icon: CheckCircle },
    { to: '/worker/welfare', label: 'Welfare & Insurance', icon: LifeBuoy },
    { to: '/worker/ratings', label: 'Ratings & Feedback', icon: Star },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Platform Metrics', icon: LayoutDashboard },
    { to: '/admin/verifications', label: 'Worker Verifications', icon: ShieldAlert },
    { to: '/admin/catalog', label: 'Services & Skills', icon: Wrench },
    { to: '/admin/bookings', label: 'All Platform Bookings', icon: Calendar },
    { to: '/admin/welfare', label: 'Welfare Fund Ledger', icon: LifeBuoy },
    { to: '/admin/forecasting', label: 'AI Demand Forecasting', icon: TrendingUp },
    { to: '/admin/users', label: 'User Directory', icon: Users },
  ];

  const links =
    role === 'customer' ? customerLinks : role === 'gig_worker' ? workerLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 hidden md:block shrink-0">
      <div className="mb-6 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Portal Access</div>
        <div className="text-sm font-semibold text-slate-800 capitalize mt-0.5">
          {role.replace('_', ' ')} Workspace
        </div>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
