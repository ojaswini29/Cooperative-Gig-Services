import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { Home } from './pages/Public/Home';
import { Login } from './pages/Public/Login';
import { Register } from './pages/Public/Register';

// Customer Pages
import { CustomerDashboard } from './pages/Customer/CustomerDashboard';
import { BrowseServices } from './pages/Customer/BrowseServices';

// Worker Pages
import { WorkerDashboard } from './pages/Worker/WorkerDashboard';
import { WorkerProfileSetup } from './pages/Worker/WorkerProfileSetup';
import { WorkerSkillsManager } from './pages/Worker/WorkerSkillsManager';
import { WorkerJobsView } from './pages/Worker/WorkerJobsView';
import { WorkerWelfareHub } from './pages/Worker/WorkerWelfareHub';
import { WorkerRatingsView } from './pages/Worker/WorkerRatingsView';

// Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { WorkerVerificationView } from './pages/Admin/WorkerVerificationView';
import { CategorySkillsAdmin } from './pages/Admin/CategorySkillsAdmin';
import { BookingsAdminView } from './pages/Admin/BookingsAdminView';
import { WelfareAdminLedger } from './pages/Admin/WelfareAdminLedger';
import { DemandForecastingView } from './pages/Admin/DemandForecastingView';
import { UserManagementView } from './pages/Admin/UserManagementView';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/services" element={<BrowseServices />} />
              <Route path="/customer/bookings" element={<CustomerDashboard />} />
            </Route>

            {/* Gig Worker Routes */}
            <Route element={<ProtectedRoute allowedRoles={['gig_worker']} />}>
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
              <Route path="/worker/profile" element={<WorkerProfileSetup />} />
              <Route path="/worker/skills" element={<WorkerSkillsManager />} />
              <Route path="/worker/jobs" element={<WorkerJobsView />} />
              <Route path="/worker/welfare" element={<WorkerWelfareHub />} />
              <Route path="/worker/ratings" element={<WorkerRatingsView />} />
            </Route>

            {/* Cooperative Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['cooperative_admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/verifications" element={<WorkerVerificationView />} />
              <Route path="/admin/catalog" element={<CategorySkillsAdmin />} />
              <Route path="/admin/bookings" element={<BookingsAdminView />} />
              <Route path="/admin/welfare" element={<WelfareAdminLedger />} />
              <Route path="/admin/forecasting" element={<DemandForecastingView />} />
              <Route path="/admin/users" element={<UserManagementView />} />
            </Route>

            {/* Fallback Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
