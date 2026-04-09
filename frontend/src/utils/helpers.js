import { format } from 'date-fns';
import { BALANCE_THRESHOLDS } from './constants';

// Format number as LKR currency
export const formatCurrency = (amount) => {
  return `Rs. ${Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return '';
  }
};

// Truncate long text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get Tailwind color classes for approval status
export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// Get status and color for petty cash balance
export const getBalanceStatus = (balance) => {
  if (balance >= BALANCE_THRESHOLDS.HEALTHY) {
    return { status: 'healthy', color: 'text-green-600' };
  }
  if (balance >= BALANCE_THRESHOLDS.LOW) {
    return { status: 'low', color: 'text-yellow-600' };
  }
  if (balance >= BALANCE_THRESHOLDS.CRITICAL) {
    return { status: 'critical', color: 'text-orange-600' };
  }
  return { status: 'critical', color: 'text-red-600' };
};

// Delay function execution
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Validate email format
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Capitalize first letter of a string
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get initials from a full name
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

// Group array items by a key
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// Sort array by a key
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

// Get today's date in yyyy-MM-dd format for date inputs
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// Check if a date is in the future
export const isFutureDate = (date) => {
  return new Date(date) > new Date();
};