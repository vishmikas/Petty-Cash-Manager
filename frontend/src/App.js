import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/Admindashboard';
import EmployeeDashboard from './pages/Employeedashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import ApprovalPage from './pages/ApprovalPage';
import UsersPage from './pages/UsersPage';

// DASHBOARD ROUTER
function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'accountant') {
    return <AccountantDashboard />;
  }

  if (
    user?.role === 'manager' ||
    user?.role === 'employee'
  ) {
    return <EmployeeDashboard />;
  }

  return <Navigate to="/login" replace />;
}


// MAIN APP
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Route - Login */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardRouter />
              </PrivateRoute>
            }
          />

          <Route
            path="/approvals"
            element={
              <PrivateRoute roles={['manager', 'admin']}>
                <ApprovalPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute roles={['admin']}>
                <UsersPage />
              </PrivateRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;