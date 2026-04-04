import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';

// Public / Landing
import LandingPage from '@/pages/public/LandingPage';

// Auth
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// User
import DashboardPage from '@/pages/user/DashboardPage';
import SOSActivePage from '@/pages/user/SOSActivePage';
import MapPage from '@/pages/user/MapPage';
import GuardiansPage from '@/pages/user/GuardiansPage';
import IncidentsPage from '@/pages/user/IncidentsPage';
import SOSHistoryPage from '@/pages/user/SOSHistoryPage';
import ProfilePage from '@/pages/user/ProfilePage';

// Guardian
import GuardianAlertPage from '@/pages/guardian/GuardianAlertPage';
import AlertsPage from '@/pages/guardian/AlertsPage';

// Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import HeatmapPage from '@/pages/admin/HeatmapPage';
import ActiveSOSPage from '@/pages/admin/ActiveSOSPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';

const ALL_ROLES = ['user', 'volunteer', 'admin'];

/**
 * AuthenticatedLayout:
 * Wraps ALL protected pages in AppShell which calls useSocket().
 * This is INSIDE the Router context so useNavigate() works correctly.
 */
const AuthenticatedLayout = () => (
  <ProtectedRoute>
    <AppShell>
      <Outlet />
    </AppShell>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },

  // Public (no socket needed)
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // All authenticated routes share the AppShell (socket connection)
  {
    element: <AuthenticatedLayout />,
    children: [
      // User pages
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/sos/active', element: <SOSActivePage /> },
      { path: '/sos/history', element: <SOSHistoryPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/guardians', element: <GuardiansPage /> },
      { path: '/incidents', element: <IncidentsPage /> },
      { path: '/profile', element: <ProfilePage /> },

      // Guardian / Volunteer
      { path: '/alerts', element: <AlertsPage /> },
      { path: '/guardian/alert/:id', element: <GuardianAlertPage /> },

      // Admin (role check inside each admin page)
      { path: '/admin', element: <AdminDashboardPage /> },
      { path: '/admin/heatmap', element: <HeatmapPage /> },
      { path: '/admin/sos', element: <ActiveSOSPage /> },
      { path: '/admin/users', element: <UserManagementPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
