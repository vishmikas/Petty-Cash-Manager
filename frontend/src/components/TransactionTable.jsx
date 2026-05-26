import React from 'react';
import { Edit, Trash2, FileText, CheckCircle2, Clock3, XCircle, ExternalLink } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from './ui';
import { formatCurrency, formatDate, truncateText, capitalize } from '../utils/helpers';

const statusVariant = (status) => {
  if (status === 'approved') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'destructive';
  return 'muted';
};

const statusIcon = (status) => {
  if (status === 'approved') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'pending') return <Clock3 className="h-3.5 w-3.5" />;
  if (status === 'rejected') return <XCircle className="h-3.5 w-3.5" />;
  return null;
};

export default function TransactionTable({ transactions = [], onEdit, onDelete, userRole, userId }) {
  const canEdit = (transaction) => {
    if (!onEdit) return false;
    if (userRole === 'admin') return transaction.approvalStatus !== 'approved';
    if (userRole === 'employee') {
      return transaction.employee?._id === userId && ['pending', 'rejected'].includes(transaction.approvalStatus);
    }
    return false;
  };

  const canDelete = (transaction) => {
    if (!onDelete) return false;
    if (userRole === 'admin') return true;
    if (userRole === 'employee') {
      return transaction.employee?._id === userId && ['pending', 'rejected'].includes(transaction.approvalStatus);
    }
    return false;
  };

  if (!transactions.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No transactions found"
        description="Try changing your filters, or create a new petty cash transaction."
      />
    );
  }

  return (
    <Card className="overflow-hidden bg-white/90 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Ref</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-left font-semibold">Employee</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((transaction) => (
              <tr key={transaction._id} className="transition-colors hover:bg-muted/40">
                <td className="whitespace-nowrap px-4 py-4 font-medium text-muted-foreground">{transaction.referenceNumber || '-'}</td>
                <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatDate(transaction.date)}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">{truncateText(transaction.description, 48)}</div>
                  {transaction.notes && <div className="mt-1 text-xs text-muted-foreground">{truncateText(transaction.notes, 60)}</div>}
                  {transaction.receiptUrl && (
                    <a className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline" href={transaction.receiptUrl} target="_blank" rel="noreferrer">
                      Receipt <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-foreground">{transaction.employee?.name || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{transaction.employee?.department?.name || transaction.department?.name || ''}</div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{transaction.category || '-'}</td>
                <td className="px-4 py-4">
                  <Badge variant={transaction.type === 'ALLOCATION' ? 'success' : 'secondary'}>{transaction.type}</Badge>
                </td>
                <td className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${transaction.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {transaction.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-4 text-center">
                  <Badge variant={statusVariant(transaction.approvalStatus)} className="gap-1 capitalize">
                    {statusIcon(transaction.approvalStatus)}
                    {capitalize(transaction.approvalStatus)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {canEdit(transaction) && (
                      <Button variant="outline" size="sm" onClick={() => onEdit(transaction)}>
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                    {canDelete(transaction) && (
                      <Button variant="destructive" size="sm" onClick={() => onDelete(transaction._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
