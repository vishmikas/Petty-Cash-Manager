import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Activity
} from 'lucide-react';
import { formatCurrency, calculatePercentage } from '../utils/helpers';

const StatCard = ({ 
  title, 
  amount, 
  icon: Icon, 
  iconBg, 
  cardBg, 
  subtitle,
  isCurrency = true
}) => (
  <div className={`${cardBg} p-6 rounded-xl shadow-lg 
    hover:shadow-xl transition-all duration-300 
    transform hover:-translate-y-1`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-slate-600 text-sm font-medium mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-800 mb-1">
          {isCurrency ? formatCurrency(amount) : amount}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg} shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);


export default function DashboardStats({ analytics }) {
  if (!analytics) return null;

  const {
    totalAllocated = 0,
    totalExpense = 0,
    balance = 0,
    pendingExpenses = 0,
    transactionCount = 0
  } = analytics.summary || {};

  const spentPercentage = calculatePercentage(
    totalExpense,
    totalAllocated
  );

  return (
    <div className="mb-8">

      <div className="grid grid-cols-1 md:grid-cols-2 
        lg:grid-cols-4 gap-6 mb-6">

        <StatCard
          title="Total Allocated"
          amount={totalAllocated}
          icon={TrendingUp}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          cardBg="bg-gradient-to-br from-white to-blue-50"
          subtitle={`${transactionCount} total transactions`}
        />

        <StatCard
          title="Total Expenses"
          amount={totalExpense}
          icon={TrendingDown}
          iconBg="bg-gradient-to-br from-rose-500 to-rose-600"
          cardBg="bg-gradient-to-br from-white to-rose-50"
          subtitle="Approved expenses only"
        />

        <StatCard
          title="Current Balance"
          amount={balance}
          icon={Wallet}
          iconBg={
            balance >= 0
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
              : "bg-gradient-to-br from-red-500 to-red-600"
          }
          cardBg="bg-gradient-to-br from-white to-emerald-50"
          subtitle="Allocated minus expenses"
        />

        <StatCard
          title="Pending Approval"
          amount={pendingExpenses}
          icon={Clock}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          cardBg="bg-gradient-to-br from-white to-amber-50"
          subtitle="Awaiting manager review"
        />
      </div>

      {totalAllocated > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg 
          border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">
                  Spending Rate
                </h4>
                <span className="text-sm font-bold text-slate-700">
                  {spentPercentage}% of allocated cash spent
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 rounded-full h-3 
            overflow-hidden">
            <div
              className={`h-full rounded-full transition-all 
                duration-500 ${
                spentPercentage > 80
                  ? 'bg-red-500'
                  : spentPercentage > 50
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(spentPercentage, 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs 
            text-slate-500 mt-2">
            <span>Rs. 0</span>
            <span>{formatCurrency(totalAllocated)}</span>
          </div>
        </div>
      )}
    </div>
  );
}