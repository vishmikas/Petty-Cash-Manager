import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Landmark, 
  LogOut, 
  Home, 
  CheckSquare, 
  Users,
  User
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md border-b border-slate-200 
      sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          <Link 
            to="/" 
            className="flex items-center gap-2 
              hover:opacity-80 transition-opacity"
          >
            <div className="bg-blue-600 p-2 rounded-lg">
              <Landmark className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800">
              Petty Cash
            </span>
          </Link>

          <div className="flex items-center gap-1">

            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 
                rounded-lg text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Home size={16} />
              Dashboard
            </Link>

            {['manager', 'admin'].includes(user?.role) && (
              <Link
                to="/approvals"
                className={`flex items-center gap-2 px-3 py-2 
                  rounded-lg text-sm font-medium transition-all ${
                  isActive('/approvals')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <CheckSquare size={16} />
                Approvals
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/users"
                className={`flex items-center gap-2 px-3 py-2 
                  rounded-lg text-sm font-medium transition-all ${
                  isActive('/users')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Users size={16} />
                Users
              </Link>
            )}

            <div className="border-l border-slate-200 
              pl-3 ml-2 flex items-center gap-3">

              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <User size={14} className="text-blue-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-700 
                    leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize 
                    leading-none mt-0.5">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 
                  text-red-600 hover:bg-red-50 rounded-lg 
                  transition-all text-sm font-medium"
                title="Logout"
              >
                <LogOut size={16} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}