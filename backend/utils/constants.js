exports.User_ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    ACCOUNTANT: 'accountant',
};

exports.TRANSACTION_TYPES = {
    ALLOCATION: 'ALLOCATION',
    EXPENSE: 'EXPENSE',
};

exports.APPROVAL_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

exports.EXPENSE_CATEGORIES = [
    'Office Supplies',
  'Transportation',
  'Meals & Entertainment',
  'Utilities',
  'Maintenance',
  'Miscellaneous',
  'General',
  'Petty Cash Allocation'
];

exports.VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    DESCRIPTION_MAX_LENGTH: 200,
    NOTES_MAX_LENGTH: 500,
    AMOUNT_MIN: 0.01,
    AMOUNT_MAX: 9999999
};

exports.MESSAGES = {
    SUCCESS: {
        ALLOCATION_CREATED: 'Petty cash allocation created successfully',
        EXPENSE_CREATED: 'Expense created successfully',
        TRANSACTION_APPROVED: 'Transaction approved successfully',
        TRANSACTION_REJECTED: 'Transaction rejected successfully',
        TRANSACTION_DELETED: 'Transaction deleted successfully',
        USER_CREATED: `User created successfully`,
        USER_UPDATED: `User updated successfully`,
        DEPARTMENT_CREATED: 'Department created successfully',
        DEPARTMENT_UPDATED: 'Department updated successfully',
    },
    ERROR: {
        INVALID_CREDENTIALS: `Invalid creadentials`,
        UNAUTHORIZED: `Unauthorized access to this route`,
        FORBIDDEN: `User role is not authorized`,
        NOT_FOUND: `Resource not found`,
        INSUFFICIENT_BALANCE: `Insufficient petty cash balance`,
        INVALID_AMOUNT: `INVALID AMOUNT`,
        FUTURE_DATE: `Date cannot be in the future`,
        USER_EXISTS: `User with this email already exists`,
        SERVER_ERROR: `Server error, please try again later`
    }
};

exports.STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};