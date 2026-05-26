import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, LayoutDashboard, CheckCircle2, Users, Building2 } from 'lucide-react';
import { Badge, Button } from './ui';
import { capitalize, getInitials } from '../utils/helpers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'employee', 'manager', 'accountant'] },
    { label: 'Approvals', href: '/approvals', icon: CheckCircle2, roles: ['admin', 'manager'] },
    { label: 'Users', href: '/users', icon: Users, roles: ['admin'] },
    { label: 'Departments', href: '/departments', icon: Building2, roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role));

  const isActive = (href) => location.pathname === href;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center">
          <div className="leading-tight">
            <p className="text-xl font-black tracking-[0.18em] text-slate-950 transition-colors group-hover:text-primary">PETTYCASH</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">Control Center</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-3 rounded-full border bg-card px-3 py-1.5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {getInitials(user?.name)}
            </div>
            <div className="leading-tight">
              <p className="max-w-[140px] truncate text-sm font-medium text-foreground">{user?.name}</p>
              <Badge variant="secondary" className="mt-0.5 capitalize">{capitalize(user?.role)}</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <div className="mb-4 flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
              {getInitials(user?.name)}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="grid gap-2">
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(href) ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <Button variant="outline" onClick={handleLogout} className="justify-start">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
