/**
 * ──────────────────────────────────────────────────
 * File: src/testIds.ts
 * Description: Central test ID constants for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 26-06-2025
 * ──────────────────────────────────────────────────
 */

export const TestIds = {
  // Navigation
  navigation: {
    dashboard: 'navigation-dashboard',
    organizations: 'navigation-organizations',
    users: 'navigation-users',
    subscriptions: 'navigation-subscriptions',
    products: 'navigation-products',
    transcripts: 'navigation-transcripts',
    auditLog: 'navigation-audit-log',
    logout: 'navigation-logout',
  },

  // Login
  login: {
    username: 'login-username',
    password: 'login-password',
    submit: 'login-submit',
    forgotCredentials: 'login-forgot-credentials',
    forgotDialog: 'login-forgot-dialog',
    forgotDialogClose: 'login-forgot-dialog-close',
  },

  // Dashboard
  dashboard: {
    page: 'dashboard-page',
    healthCheck: 'dashboard-health-check',
    apiStatus: 'dashboard-api-status',
    refreshHealth: 'dashboard-refresh-health',
    refreshStatus: 'dashboard-refresh-status',
  },

  // Filter Form
  filterForm: {
    container: 'filter-form-container',
    expandCollapse: 'filter-form-expand-collapse',
    clearFilters: 'filter-form-clear',
    clearButton: 'filter-form-clear-button',
    clearSearch: 'filter-form-clear-search',
    applyFilters: 'filter-form-apply',
    search: 'filter-form-search',
    status: 'filter-form-status',
    domain: 'filter-form-domain',
    organization: 'filter-form-organization',
    role: 'filter-form-role',
    email: 'filter-form-email',
    product: 'filter-form-product',
    tier: 'filter-form-tier',
    entityType: 'filter-form-entity-type',
    action: 'filter-form-action',
    dateFrom: 'filter-form-date-from',
    dateTo: 'filter-form-date-to',
    page: 'filter-form-page',
    pageSize: 'filter-form-page-size',
  },

  // Entity Table
  entityTable: {
    container: 'entity-table-container',
    refresh: 'entity-table-refresh',
    pagination: 'entity-table-pagination',
    rowsPerPage: 'entity-table-rows-per-page',
    nextPage: 'entity-table-next-page',
    previousPage: 'entity-table-previous-page',
    sortColumn: (columnName: string) => `entity-table-sort-${columnName}`,
    expandRow: (rowId: string) => `entity-table-expand-${rowId}`,
    actionButton: (action: string, rowId: string) =>
      `entity-table-action-${action}-${rowId}`,
  },

  // Create Dialog
  createDialog: {
    container: 'create-dialog-container',
    title: 'create-dialog-title',
    submit: 'create-dialog-submit',
    cancel: 'create-dialog-cancel',
    close: 'create-dialog-close',
    field: (fieldName: string) => `create-dialog-field-${fieldName}`,
    error: 'create-dialog-error',
  },

  // Organizations
  organizations: {
    page: 'organizations-page',
    createButton: 'organizations-create-button',
    table: 'organizations-table',
    viewDetails: (orgId: string) => `organizations-view-details-${orgId}`,
    edit: (orgId: string) => `organizations-edit-${orgId}`,
    delete: (orgId: string) => `organizations-delete-${orgId}`,
    updateStatus: (orgId: string) => `organizations-update-status-${orgId}`,
    viewMetrics: (orgId: string) => `organizations-view-metrics-${orgId}`,
    viewUsers: (orgId: string) => `organizations-view-users-${orgId}`,
    viewSubscriptions: (orgId: string) =>
      `organizations-view-subscriptions-${orgId}`,
    
    // Create Dialog
    createDialog: {
      container: 'organizations-create-dialog',
      title: 'organizations-create-dialog-title',
      tenantName: 'organizations-create-tenant-name',
      organizationDomain: 'organizations-create-domain',
      adminEmail: 'organizations-create-admin-email',
      status: 'organizations-create-status',
      submit: 'organizations-create-submit',
      cancel: 'organizations-create-cancel',
      error: 'organizations-create-error',
    },
    
    // Edit Dialog
    editDialog: {
      container: 'organizations-edit-dialog',
      title: 'organizations-edit-dialog-title',
      tenantName: 'organizations-edit-tenant-name',
      organizationDomain: 'organizations-edit-domain',
      status: 'organizations-edit-status',
      submit: 'organizations-edit-submit',
      cancel: 'organizations-edit-cancel',
    },
    
    // Subscription Form
    subscriptionForm: {
      container: 'organizations-subscription-form',
      addButton: 'organizations-subscription-add',
      removeButton: (index: number) => `organizations-subscription-remove-${index}`,
      productSelect: (index: number) => `organizations-subscription-product-${index}`,
      tierSelect: (index: number) => `organizations-subscription-tier-${index}`,
      endDate: (index: number) => `organizations-subscription-end-date-${index}`,
      subscriptionCard: (index: number) => `organizations-subscription-card-${index}`,
    },
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
    recordLogin: (userId: string) => `users-record-login-${userId}`,
    
    // Create Dialog
    createDialog: {
      container: 'users-create-dialog',
      title: 'users-create-dialog-title',
      organization: 'users-create-organization',
      domain: 'users-create-domain',
      email: 'users-create-email',
      firstName: 'users-create-first-name',
      lastName: 'users-create-last-name',
      role: 'users-create-role',
      submit: 'users-create-submit',
      cancel: 'users-create-cancel',
      error: 'users-create-error',
    },
    
    // Edit Dialog
    editDialog: {
      container: 'users-edit-dialog',
      title: 'users-edit-dialog-title',
      organization: 'users-edit-organization',
      domain: 'users-edit-domain',
      email: 'users-edit-email',
      firstName: 'users-edit-first-name',
      lastName: 'users-edit-last-name',
      role: 'users-edit-role',
      status: 'users-edit-status',
      submit: 'users-edit-submit',
      cancel: 'users-edit-cancel',
    },
    
    // View Dialog
    viewDialog: {
      container: 'users-view-dialog',
      title: 'users-view-dialog-title',
      editButton: 'users-view-edit-button',
      closeButton: 'users-view-close-button',
    },
  },

  // Subscriptions
  subscriptions: {
    page: 'subscriptions-page',
    createButton: 'subscriptions-create-button',
    table: 'subscriptions-table',
    viewDetails: (subId: string) => `subscriptions-view-details-${subId}`,
    edit: (subId: string) => `subscriptions-edit-${subId}`,
    updateStatus: (subId: string) => `subscriptions-update-status-${subId}`,
    recordUsage: (subId: string) => `subscriptions-record-usage-${subId}`,
    viewUsage: (subId: string) => `subscriptions-view-usage-${subId}`,
    checkLimits: (subId: string) => `subscriptions-check-limits-${subId}`,
    cancel: (subId: string) => `subscriptions-cancel-${subId}`,
    
    // Create Dialog
    createDialog: {
      container: 'subscriptions-create-dialog',
      title: 'subscriptions-create-dialog-title',
      organization: 'subscriptions-create-organization',
      product: 'subscriptions-create-product',
      tier: 'subscriptions-create-tier',
      startDate: 'subscriptions-create-start-date',
      submit: 'subscriptions-create-submit',
      cancel: 'subscriptions-create-cancel',
      error: 'subscriptions-create-error',
    },
    
    // Edit Dialog
    editDialog: {
      container: 'subscriptions-edit-dialog',
      title: 'subscriptions-edit-dialog-title',
      tier: 'subscriptions-edit-tier',
      status: 'subscriptions-edit-status',
      submit: 'subscriptions-edit-submit',
      cancel: 'subscriptions-edit-cancel',
      error: 'subscriptions-edit-error',
    },
  },

  // Transcripts
  transcripts: {
    page: 'transcripts-page',
    fileInput: 'transcripts-file-input',
    browseButton: 'transcripts-browse-button',
    formatSelect: 'transcripts-format-select',
    submitButton: 'transcripts-submit-button',
    clearButton: 'transcripts-clear-button',
    responseDisplay: 'transcripts-response-display',
  },

  // Products
  products: {
    page: 'products-page',
    createButton: 'products-create-button',
    table: 'products-table',
    viewDetails: (productId: string) => `products-view-details-${productId}`,
    edit: (productId: string) => `products-edit-${productId}`,
    delete: (productId: string) => `products-delete-${productId}`,
    
    // Create Dialog
    createDialog: {
      container: 'products-create-dialog',
      title: 'products-create-dialog-title',
      name: 'products-create-name',
      description: 'products-create-description',
      submit: 'products-create-submit',
      cancel: 'products-create-cancel',
    },
    
    // Edit Dialog
    editDialog: {
      container: 'products-edit-dialog',
      title: 'products-edit-dialog-title',
      name: 'products-edit-name',
      description: 'products-edit-description',
      submit: 'products-edit-submit',
      cancel: 'products-edit-cancel',
    },
    
    // View Dialog
    viewDialog: {
      container: 'products-view-dialog',
      title: 'products-view-dialog-title',
      editButton: 'products-view-edit-button',
      closeButton: 'products-view-close-button',
    },
  },

  // Audit Log
  auditLog: {
    page: 'audit-log-page',
    table: 'audit-log-table',
    viewDetails: (logId: string) => `audit-log-view-details-${logId}`,
    expandDetails: (logId: string) => `audit-log-expand-details-${logId}`,
    
    // View Dialog
    viewDialog: {
      container: 'audit-log-view-dialog',
      title: 'audit-log-view-dialog-title',
      closeButton: 'audit-log-view-close-button',
    },
  },

  // Common Actions
  common: {
    confirmDialog: 'common-confirm-dialog',
    confirmYes: 'common-confirm-yes',
    confirmNo: 'common-confirm-no',
    closeDialog: 'common-close-dialog',
    loadingSpinner: 'common-loading-spinner',
    errorAlert: 'common-error-alert',
    successAlert: 'common-success-alert',
  },

  // ────────────────────────────────────────
  // Reusable Demo
  // ────────────────────────────────────────
  reusableDemo: {
    page: 'reusable-demo-page',
    createButton: 'reusable-demo-create-button',
    openCreateDialog: 'reusable-demo-open-create-dialog',
  },

  // Domain management
  addDomainButton: 'add-domain-button',
  domainNameInput: 'domain-name-input',
  createDomainButton: 'create-domain-button',
  editDomainButton: 'edit-domain-button',
  deleteDomainButton: 'delete-domain-button',
  addSubdomainButton: 'add-subdomain-button',
  domainManagementSection: 'domain-management-section',
};

// ──────────────────────────────────────────────────
// End of File: src/testIds.ts
// ────────────────────────────────────────────────── 