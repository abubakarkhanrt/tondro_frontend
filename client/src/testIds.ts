/**
 * ──────────────────────────────────────────────────
 * File: client/src/testIds.ts
 * Description: Central test ID constants for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 24-06-2025
 * ──────────────────────────────────────────────────
 */

export const TestIds = {
  // Navigation
  navigation: {
    dashboard: "navigation-dashboard",
    organizations: "navigation-organizations",
    users: "navigation-users",
    subscriptions: "navigation-subscriptions",
    products: "navigation-products",
    auditLog: "navigation-audit-log",
    logout: "navigation-logout"
  },

  // Login
  login: {
    username: "login-username",
    password: "login-password",
    submit: "login-submit",
    forgotCredentials: "login-forgot-credentials",
    forgotDialog: "login-forgot-dialog",
    forgotDialogClose: "login-forgot-dialog-close"
  },

  // Dashboard
  dashboard: {
    page: "dashboard-page",
    healthCheck: "dashboard-health-check",
    apiStatus: "dashboard-api-status",
    refreshHealth: "dashboard-refresh-health",
    refreshStatus: "dashboard-refresh-status"
  },

  // Filter Form
  filterForm: {
    container: "filter-form-container",
    expandCollapse: "filter-form-expand-collapse",
    clearFilters: "filter-form-clear",
    clearButton: "filter-form-clear-button",
    clearSearch: "filter-form-clear-search",
    applyFilters: "filter-form-apply",
    search: "filter-form-search",
    status: "filter-form-status",
    domain: "filter-form-domain",
    organization: "filter-form-organization",
    role: "filter-form-role",
    email: "filter-form-email",
    product: "filter-form-product",
    tier: "filter-form-tier",
    entityType: "filter-form-entity-type",
    action: "filter-form-action",
    dateFrom: "filter-form-date-from",
    dateTo: "filter-form-date-to",
    page: "filter-form-page",
    pageSize: "filter-form-page-size"
  },

  // Entity Table
  entityTable: {
    container: "entity-table-container",
    refresh: "entity-table-refresh",
    pagination: "entity-table-pagination",
    rowsPerPage: "entity-table-rows-per-page",
    nextPage: "entity-table-next-page",
    previousPage: "entity-table-previous-page",
    sortColumn: (columnName: string) => `entity-table-sort-${columnName}`,
    expandRow: (rowId: string) => `entity-table-expand-${rowId}`,
    actionButton: (action: string, rowId: string) => `entity-table-action-${action}-${rowId}`
  },

  // Create Dialog
  createDialog: {
    container: "create-dialog-container",
    title: "create-dialog-title",
    submit: "create-dialog-submit",
    cancel: "create-dialog-cancel",
    close: "create-dialog-close",
    field: (fieldName: string) => `create-dialog-field-${fieldName}`,
    error: "create-dialog-error"
  },

  // Organizations
  organizations: {
    page: "organizations-page",
    createButton: "organizations-create-button",
    table: "organizations-table",
    viewDetails: (orgId: string) => `organizations-view-details-${orgId}`,
    edit: (orgId: string) => `organizations-edit-${orgId}`,
    delete: (orgId: string) => `organizations-delete-${orgId}`,
    updateStatus: (orgId: string) => `organizations-update-status-${orgId}`,
    viewMetrics: (orgId: string) => `organizations-view-metrics-${orgId}`,
    viewUsers: (orgId: string) => `organizations-view-users-${orgId}`,
    viewSubscriptions: (orgId: string) => `organizations-view-subscriptions-${orgId}`
  },

  // Users
  users: {
    page: "users-page",
    table: "users-table",
    createButton: "users-create-button",
    viewDetails: (id: string) => `users-view-details-${id}`,
    edit: (id: string) => `users-edit-${id}`,
    deactivate: (id: string) => `users-deactivate-${id}`,
    updateRole: (userId: string) => `users-update-role-${userId}`,
    updateStatus: (userId: string) => `users-update-status-${userId}`,
    recordLogin: (userId: string) => `users-record-login-${userId}`
  },

  // Subscriptions
  subscriptions: {
    page: "subscriptions-page",
    createButton: "subscriptions-create-button",
    table: "subscriptions-table",
    viewDetails: (subId: string) => `subscriptions-view-details-${subId}`,
    edit: (subId: string) => `subscriptions-edit-${subId}`,
    updateStatus: (subId: string) => `subscriptions-update-status-${subId}`,
    recordUsage: (subId: string) => `subscriptions-record-usage-${subId}`,
    viewUsage: (subId: string) => `subscriptions-view-usage-${subId}`,
    checkLimits: (subId: string) => `subscriptions-check-limits-${subId}`,
    cancel: (subId: string) => `subscriptions-cancel-${subId}`
  },

  // Products
  products: {
    page: "products-page",
    createButton: "products-create-button",
    table: "products-table",
    viewDetails: (productId: string) => `products-view-details-${productId}`,
    edit: (productId: string) => `products-edit-${productId}`,
    delete: (productId: string) => `products-delete-${productId}`
  },

  // Audit Log
  auditLog: {
    page: "audit-log-page",
    table: "audit-log-table",
    viewDetails: (logId: string) => `audit-log-view-details-${logId}`,
    expandDetails: (logId: string) => `audit-log-expand-details-${logId}`
  },

  // Common Actions
  common: {
    confirmDialog: "common-confirm-dialog",
    confirmYes: "common-confirm-yes",
    confirmNo: "common-confirm-no",
    closeDialog: "common-close-dialog",
    loadingSpinner: "common-loading-spinner",
    errorAlert: "common-error-alert",
    successAlert: "common-success-alert"
  },

  // ────────────────────────────────────────
  // Reusable Demo
  // ────────────────────────────────────────
  reusableDemo: {
    page: 'reusable-demo-page',
    createButton: 'reusable-demo-create-button',
    openCreateDialog: 'reusable-demo-open-create-dialog'
  },

  // Domain management
  addDomainButton: "add-domain-button",
  domainNameInput: "domain-name-input",
  createDomainButton: "create-domain-button",
  editDomainButton: "edit-domain-button",
  deleteDomainButton: "delete-domain-button",
  addSubdomainButton: "add-subdomain-button",
  domainManagementSection: "domain-management-section"
};

// ──────────────────────────────────────────────────
// End of File: client/src/testIds.ts
// ────────────────────────────────────────────────── 