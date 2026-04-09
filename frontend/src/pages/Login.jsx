import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Landmark, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br
      from-blue-50 via-white to-slate-100
      flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-xl
        w-full max-w-md p-8 border border-slate-100">

        {/* Logo and Title */}
        <div className="flex items-center justify-center
          gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-xl
            shadow-lg">
            <Landmark className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Petty Cash
            </h1>
            <p className="text-sm text-slate-500">
              Management System
            </p>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-slate-700">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium
              text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300
                rounded-lg focus:ring-2 focus:ring-blue-500
                focus:border-transparent transition-all
                text-slate-800 placeholder-slate-400"
              placeholder="your.email@company.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium
              text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300
                  rounded-lg focus:ring-2 focus:ring-blue-500
                  focus:border-transparent transition-all
                  text-slate-800 placeholder-slate-400 pr-12"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2
                  -translate-y-1/2 text-slate-400
                  hover:text-slate-600 transition-colors"
              >
                {showPassword
                  ? <EyeOff size={18} />
                  : <Eye size={18} />
                }
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200
              text-red-700 p-3 rounded-lg text-sm
              flex items-center gap-2">
              <span className="text-red-500">⚠</span>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700
              text-white p-3 rounded-lg font-medium
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all active:scale-95 shadow-md
              mt-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full
                  h-5 w-5 border-b-2 border-white" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Contact your administrator for account access
          </p>
        </div>

        {/* Role Guide */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg
          border border-slate-200">
          <p className="text-xs font-semibold text-slate-600
            mb-2 text-center">
            Role Access Guide
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs
            text-slate-500">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full
                bg-blue-500 flex-shrink-0" />
              Admin — Full access
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full
                bg-emerald-500 flex-shrink-0" />
              Manager — Approvals
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full
                bg-amber-500 flex-shrink-0" />
              Employee — Expenses
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full
                bg-purple-500 flex-shrink-0" />
              Accountant — Reports
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}