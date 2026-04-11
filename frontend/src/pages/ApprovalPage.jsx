import React, { useEffect, useState, useCallback } from 'react';
// ❌ removed useAuth import (not used)
// import { useAuth } from '../contexts/AuthContext';

import {
  getPendingTransactions,
  approveTransaction,
  rejectTransaction
} from '../services/api';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function ApprovalPage() {

  // STATE
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [rejectModal, setRejectModal] = useState({
    show: false,
    transactionId: null,
    reason: ''
  });

  // LOAD PENDING TRANSACTIONS
  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPendingTransactions();
      setPendingTransactions(response.data.data);
    } catch (error) {
      console.error('Load pending error:', error);
      showToast(
        error.response?.data?.error ||
        'Failed to load pending transactions',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // HELPERS
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // APPROVE TRANSACTION
  const handleApprove = async (id) => {
    if (!window.confirm(
      'Are you sure you want to approve this transaction?'
    )) return;

    try {
      setProcessingId(id);
      await approveTransaction(id);

      setPendingTransactions(prev =>
        prev.filter(t => t._id !== id)
      );

      showToast('Transaction approved successfully!', 'success');
    } catch (error) {
      console.error('Approve error:', error);
      showToast(
        error.response?.data?.error ||
        'Failed to approve transaction',
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // OPEN REJECT MODAL
  const openRejectModal = (id) => {
    setRejectModal({
      show: true,
      transactionId: id,
      reason: ''
    });
  };

  // REJECT TRANSACTION
  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      setProcessingId(rejectModal.transactionId);
      await rejectTransaction(
        rejectModal.transactionId,
        rejectModal.reason
      );

      setPendingTransactions(prev =>
        prev.filter(t => t._id !== rejectModal.transactionId)
      );

      showToast('Transaction rejected', 'success');
      setRejectModal({ show: false, transactionId: null, reason: '' });
    } catch (error) {
      console.error('Reject error:', error);
      showToast(
        error.response?.data?.error ||
        'Failed to reject transaction',
        'error'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Clock className="text-orange-500" />
                Pending Approvals
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Review and approve or reject employee expenses
              </p>
            </div>

            {pendingTransactions.length > 0 && (
              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
                <AlertCircle size={18} />
                {pendingTransactions.length} pending
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-slate-400 mt-4">
              Loading pending transactions...
            </p>
          </div>
        ) : pendingTransactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-500">
              No pending transactions to review.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
              >
                <h3 className="font-bold">{transaction.description}</h3>
                <p>{formatCurrency(transaction.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast(prev => ({ ...prev, show: false }))
          }
        />
      )}
    </div>
  );
}