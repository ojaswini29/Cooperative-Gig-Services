import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, LayoutDashboard, Briefcase, Award, LifeBuoy } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              CoopGig <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Gov/Coop</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Cooperative Gig Services Platform</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {!user ? (
            <>
              <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
              >
                Register Account
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {user.role === 'customer' && 'Customer'}
                {user.role === 'gig_worker' && 'Gig Worker'}
                {user.role === 'cooperative_admin' && 'Coop Admin'}
              </span>

              <div className="text-right">
                <div className="text-sm font-semibold text-white">{user.full_name}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
