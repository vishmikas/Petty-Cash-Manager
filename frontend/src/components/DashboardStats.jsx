import React from 'react';
import { Wallet, TrendingDown, CheckCircle2, Clock3, XCircle, Activity } from 'lucide-react';
import { Card, CardContent } from './ui';
import { formatCurrency } from '../utils/helpers';

const StatCard = ({ title, value, description, icon: Icon, tone = 'default' }) => {
  const tones = {
    default: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    slate: 'bg-slate-50 text-slate-700 ring-slate-600/20'
  };

  return (
    <Card className="overflow-hidden bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ring-1 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardStats({ analytics }) {
  const totalAllocated = analytics?.totalAllocated || analytics?.summary?.totalAllocated || 0;
  const totalSpent = analytics?.totalSpent || analytics?.summary?.totalSpent || 0;
  const pendingCount = analytics?.pendingCount || analytics?.summary?.pendingCount || 0;
  const approvedCount = analytics?.approvedCount || analytics?.summary?.approvedCount || 0;
  const rejectedCount = analytics?.rejectedCount || analytics?.summary?.rejectedCount || 0;
  const remaining = totalAllocated - totalSpent;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title="Allocated" value={formatCurrency(totalAllocated)} description="Total petty cash issued" icon={Wallet} tone="default" />
      <StatCard title="Spent" value={formatCurrency(totalSpent)} description="Approved expenses" icon={TrendingDown} tone="danger" />
      <StatCard title="Remaining" value={formatCurrency(remaining)} description="Available balance" icon={Activity} tone={remaining >= 0 ? 'success' : 'danger'} />
      <StatCard title="Pending" value={pendingCount} description="Needs approval" icon={Clock3} tone="warning" />
      <StatCard title="Approved" value={approvedCount} description="Completed claims" icon={CheckCircle2} tone="success" />
      <StatCard title="Rejected" value={rejectedCount} description="Declined claims" icon={XCircle} tone="slate" />
    </div>
  );
}
