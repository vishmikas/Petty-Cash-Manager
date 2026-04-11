import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const { } = useAuth();

  
  // STATE
  const [pendingTransactions, setPendingTransactions] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Reject modal state
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

      // Remove approved transaction from list
      setPendingTransactions(prev =>
        prev.filter(t => t._id !== id)
      );
      showToast(
        'Transaction approved successfully!',
        'success'
      );
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

      // Remove rejected transaction from list
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
    <div className="min-h-screen bg-gradient-to-br
      from-slate-50 to-slate-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center
            justify-between">
            <div>
              <h1 className="text-3xl font-bold
                text-slate-800 flex items-center gap-3">
                <Clock className="text-orange-500" />
                Pending Approvals
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Review and approve or reject
                employee expenses
              </p>
            </div>

            {/* Pending Count Badge */}
            {pendingTransactions.length > 0 && (
              <div className="bg-orange-100 text-orange-700
                px-4 py-2 rounded-xl font-semibold
                flex items-center gap-2">
                <AlertCircle size={18} />
                {pendingTransactions.length} pending
              </div>
            )}
          </div>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin
              rounded-full h-12 w-12 border-b-2
              border-blue-600" />
            <p className="text-slate-400 mt-4">
              Loading pending transactions...
            </p>
          </div>

        /* Empty State */
        ) : pendingTransactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg
            p-16 text-center">
            <div className="bg-green-100 w-20 h-20
              rounded-full flex items-center justify-center
              mx-auto mb-4">
              <CheckCircle
                className="w-10 h-10 text-green-500"
              />
            </div>
            <h3 className="text-xl font-semibold
              text-slate-700 mb-2">
              All Caught Up!
            </h3>
            <p className="text-slate-500">
              No pending transactions to review.
            </p>
          </div>

        /* Transaction Cards */
        ) : (
          <div className="grid gap-4">
            {pendingTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="bg-white rounded-xl shadow-lg
                  border border-slate-200 p-6
                  hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row
                  md:items-center justify-between gap-4">

                  {/* Transaction Details */}
                  <div className="flex-1">

                    {/* Title Row */}
                    <div className="flex items-start
                      justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold
                          text-slate-800">
                          {transaction.description}
                        </h3>
                        <p className="text-sm text-slate-500
                          mt-0.5">
                          Submitted on{' '}
                          {formatDate(transaction.date)}
                        </p>
                      </div>

                      {/* Amount Badge */}
                      <div className="bg-rose-100
                        text-rose-700 px-4 py-2
                        rounded-xl font-bold text-lg
                        flex items-center gap-1
                        flex-shrink-0">
                        <DollarSign size={16} />
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2
                      md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-slate-500
                          text-xs mb-1">
                          Category
                        </p>
                        <span className="px-2 py-1 text-xs
                          font-medium rounded-full
                          bg-blue-50 text-blue-700
                          border border-blue-200">
                          {transaction.category}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-500
                          text-xs mb-1 flex items-center
                          gap-1">
                          <User size={11} />
                          Employee
                        </p>
                        <p className="font-medium
                          text-slate-700">
                          {transaction.employee?.name ||
                            'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500
                          text-xs mb-1 flex items-center
                          gap-1">
                          <Building2 size={11} />
                          Department
                        </p>
                        <p className="font-medium
                          text-slate-700">
                          {transaction.department?.name ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500
                          text-xs mb-1">
                          Employee Balance
                        </p>
                        <p className="font-medium
                          text-slate-700">
                          {formatCurrency(
                            transaction.employee
                              ?.pettyCashBalance || 0
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {transaction.notes && (
                      <div className="mt-2 p-3
                        bg-slate-50 rounded-lg
                        border border-slate-200">
                        <p className="text-xs
                          text-slate-500 mb-1 font-medium">
                          Notes:
                        </p>
                        <p className="text-sm text-slate-700">
                          {transaction.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col
                    gap-2 flex-shrink-0">
                    <button
                      onClick={() =>
                        handleApprove(transaction._id)
                      }
                      disabled={
                        processingId === transaction._id
                      }
                      className="flex-1 md:flex-none
                        flex items-center justify-center
                        gap-2 bg-emerald-600
                        hover:bg-emerald-700 text-white
                        px-6 py-3 rounded-lg font-medium
                        transition-all
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        min-w-[120px]"
                    >
                      {processingId === transaction._id ? (
                        <div className="animate-spin
                          rounded-full h-4 w-4
                          border-b-2 border-white" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        openRejectModal(transaction._id)
                      }
                      disabled={
                        processingId === transaction._id
                      }
                      className="flex-1 md:flex-none
                        flex items-center justify-center
                        gap-2 bg-red-600 hover:bg-red-700
                        text-white px-6 py-3 rounded-lg
                        font-medium transition-all
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        min-w-[120px]"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black
          bg-opacity-50 flex items-center
          justify-center p-4 z-50">
          <div className="bg-white rounded-xl
            shadow-2xl max-w-md w-full p-6">

            <h3 className="text-xl font-bold
              text-slate-800 mb-2 flex items-center gap-2">
              <XCircle className="text-red-500" size={22} />
              Reject Transaction
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Please provide a reason for rejection.
              This will be visible to the employee.
            </p>

            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({
                ...prev,
                reason: e.target.value
              }))}
              className="w-full p-3 border border-slate-300
                rounded-lg focus:ring-2 focus:ring-red-500
                focus:border-transparent resize-none
                text-slate-800"
              rows="4"
              placeholder="e.g., Receipt not attached,
                Amount exceeds policy limit..."
              autoFocus
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRejectModal({
                  show: false,
                  transactionId: null,
                  reason: ''
                })}
                className="flex-1 bg-slate-200
                  hover:bg-slate-300 text-slate-700
                  px-4 py-3 rounded-lg font-medium
                  transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={
                  !rejectModal.reason.trim() ||
                  processingId !== null
                }
                className="flex-1 bg-red-600
                  hover:bg-red-700 text-white
                  px-4 py-3 rounded-lg font-medium
                  transition-all disabled:opacity-50
                  disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {processingId !== null ? (
                  <div className="animate-spin
                    rounded-full h-4 w-4
                    border-b-2 border-white" />
                ) : (
                  <XCircle size={18} />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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