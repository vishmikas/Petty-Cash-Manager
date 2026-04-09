// Transaction Types
export const TRANSACTION_TYPES = {
  ALLOCATION: 'ALLOCATION',
  EXPENSE: 'EXPENSE'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  ACCOUNTANT: 'accountant'
};

// Approval Status
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Transportation',
  'Meals & Entertainment',
  'Utilities',
  'Maintenance',
  'Miscellaneous',
  'General'
];

// Validation Rules
export const VALIDATION_RULES = {
  DESCRIPTION: {
    MIN: 1,
    MAX: 200
  },
  AMOUNT: {
    MIN: 0.01,
    MAX: 999999999
  },
  NOTES: {
    MAX: 500
  },
  PASSWORD: {
    MIN: 6
  }
};

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'MMMM dd, yyyy HH:mm'
};

// Status Colors
export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  }
};

// Balance Thresholds
export const BALANCE_THRESHOLDS = {
  CRITICAL: 1000,  // Red
  LOW: 5000,       // Yellow
  HEALTHY: 10000   // Green
};