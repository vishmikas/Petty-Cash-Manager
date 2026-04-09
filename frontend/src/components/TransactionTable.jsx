import React from 'react';
import {
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  StickyNote,
  User,
  Building2
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';


export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
  userRole,
  userId
}) {

  const canEdit = (transaction) => {
    if (userRole === 'admin') return true;
    if (userRole === 'accountant') return false;
    if (transaction.approvalStatus === 'approved') return false;
    return transaction.createdBy?._id === userId;
  };

  const canDelete = (transaction) => {
    if (userRole === 'admin') return true;
    if (userRole === 'accountant') return false;
    if (transaction.approvalStatus === 'approved') return false;
    return transaction.createdBy?._id === userId;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg
      border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          {/* Table Header */}
          <thead className="bg-gradient-to-r from-slate-50
            to-slate-100 border-b-2 border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Date</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Type</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Description</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Category</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Employee</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Department</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700">Status</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700 text-right">Amount</th>
              <th className="p-4 text-sm font-semibold
                text-slate-700 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center">
                  <div className="text-slate-400">
                    <p className="text-lg font-medium mb-2">
                      No transactions found
                    </p>
                    <p className="text-sm">
                      Add your first transaction to get started
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t._id}
                  className="border-b border-slate-100
                    hover:bg-slate-50 transition-colors group"
                >
                  {/* Date */}
                  <td className="p-4 text-slate-600 font-medium
                    whitespace-nowrap">
                    {formatDate(t.date)}
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center
                      gap-1 px-2.5 py-1 text-xs font-semibold
                      rounded-full ${
                      t.type === 'ALLOCATION'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {t.type === 'ALLOCATION' ? (
                        <>
                          <ArrowUpRight size={12} />
                          Allocation
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft size={12} />
                          Expense
                        </>
                      )}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">
                        {t.description}
                      </span>
                      {t.notes && (
                        <span className="text-xs text-slate-500
                          flex items-center gap-1 mt-1">
                          <StickyNote size={12} />
                          {t.notes.substring(0, 50)}
                          {t.notes.length > 50 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs
                      font-medium rounded-full bg-blue-50
                      text-blue-700 border border-blue-200
                      whitespace-nowrap">
                      {t.category || 'General'}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2
                      text-sm text-slate-600">
                      <User size={14} />
                      {t.employee?.name || 'Unknown'}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2
                      text-sm text-slate-600">
                      <Building2 size={14} />
                      {t.department?.name || 'N/A'}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs
                      font-semibold rounded-full capitalize
                      ${getStatusColor(t.approvalStatus)}`}>
                      {t.approvalStatus}
                    </span>
                  </td>


                  <td className={`p-4 font-bold text-right
                    text-lg whitespace-nowrap ${
                    t.type === 'ALLOCATION'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}>
                    {formatCurrency(t.amount)}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end
                      opacity-0 group-hover:opacity-100
                      transition-opacity">
                      {canEdit(t) && (
                        <button
                          onClick={() => onEdit(t)}
                          className="text-blue-500
                            hover:text-blue-700
                            hover:bg-blue-50 p-2
                            rounded-lg transition-all"
                          title="Edit transaction"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete(t) && (
                        <button
                          onClick={() => onDelete(t._id)}
                          className="text-rose-500
                            hover:text-rose-700
                            hover:bg-rose-50 p-2
                            rounded-lg transition-all"
                          title="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {transactions.length > 0 && (
        <div className="bg-slate-50 px-4 py-3
          border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing{' '}
            <span className="font-semibold">
              {transactions.length}
            </span>{' '}
            transaction
            {transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}