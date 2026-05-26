import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, ShieldCheck, BarChart3, Users } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '../components/ui';

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
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.16),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#ffffff_100%)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="hidden lg:block">
          <Badge variant="secondary" className="mb-5">Finance workflow dashboard</Badge>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
            Manage petty cash with clean approvals and real-time visibility.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            A modern internal tool for allocations, employee expenses, manager approvals, and accountant reporting.
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, title: 'Role based', desc: 'Admin, manager, accountant, employee' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track balances and spend' },
              { icon: Users, title: 'Approvals', desc: 'Review expenses clearly' }
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-white/70 shadow-sm backdrop-blur">
                <CardContent className="p-4">
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-white/70 bg-white/90 shadow-soft backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex flex-col items-center gap-1">
              <span className="rounded-2xl bg-slate-950 px-5 py-2 text-lg font-black tracking-[0.24em] text-white shadow-lg shadow-slate-900/20">
                PETTYCASH
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Control Center
              </span>
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <LogIn size={18} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
