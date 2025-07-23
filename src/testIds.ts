/**
 * ──────────────────────────────────────────────────
 * File: src/testIds.ts
 * Description: Central test ID constants for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 12-07-2025
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
    jobs: 'navigation-jobs',
    auditLog: 'navigation-audit-log',
    logout: 'navigation-logout',
    userMenu: 'navigation-user-menu',
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

  // MFA
  mfa: {
    setupQrCode: 'mfa-setup-qr-code',
    setupOtpInput: 'mfa-setup-otp-input',
    setupSubmit: 'mfa-setup-submit',
    verifyOtpInput: 'mfa-verify-otp-input',
    verifySubmit: 'mfa-verify-submit',
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
    roleOption: (role: string) => `filter-form-role-option-${role}`,
    statusTrigger: 'filter-status-select-trigger',
    statusOptionAll: 'filter-status-option-all',
    statusOption: (status: string) => `filter-form-status-option-${status}`,
    organizationOption: (orgId: string) =>
      `filter-form-organization-option-${orgId}`,
    productOption: (productId: string | number) =>
      `filter-form-product-option-${productId}`,
    tierOption: (tier: string) => `filter-form-tier-option-${tier}`,
    entityTypeOption: (entityType: string) =>
      `filter-form-entity-type-option-${entityType}`,
    actionOption: (action: string) => `filter-form-action-option-${action}`,
    entityTypeOptionAll: 'filter-form-entity-type-option-all',
    actionOptionAll: 'filter-form-action-option-all',
    organizationOptionAll: 'filter-form-organization-option-all',
    roleOptionAll: 'filter-form-role-option-all',
    productOptionAll: 'filter-form-product-option-all',
    tierOptionAll: 'filter-form-tier-option-all',
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

  // Organizations
  organizations: {
    page: 'organizations-page',
    createButton: 'organizations-create-button',
    table: 'organizations-table',
    viewDetails: (orgId: string | number) =>
      `organizations-view-details-${orgId}`,
    edit: (orgId: string | number) => `organizations-edit-${orgId}`,
    delete: (orgId: string | number) => `organizations-delete-${orgId}`,
    updateStatus: (orgId: string | number) =>
      `organizations-update-status-${orgId}`,
    viewMetrics: (orgId: string | number) =>
      `organizations-view-metrics-${orgId}`,
    viewUsers: (orgId: string | number) => `organizations-view-users-${orgId}`,
    viewSubscriptions: (orgId: string | number) =>
      `organizations-view-subscriptions-${orgId}`,

    // Create Dialog
    createDialog: {
      container: 'organizations-create-dialog',
      title: 'organizations-create-dialog-title',
      tenantName: 'organizations-create-tenant-name',
      domain: 'organizations-create-domain',
      adminEmail: 'organizations-create-admin-email',
      password: 'organizations-create-password',
      confirmPassword: 'organizations-create-confirm-password',
      status: 'organizations-create-status',
      submit: 'organizations-create-submit',
      cancel: 'organizations-create-cancel',
      error: 'organizations-create-error',
      statusOption: (status: string) =>
        `organizations-create-dialog-status-option-${status}`,
    },

    // Edit Dialog
    editDialog: {
      container: 'organizations-edit-dialog',
      title: 'organizations-edit-dialog-title',
      tenantName: 'organizations-edit-tenant-name',
      domain: 'organizations-edit-domain',
      status: 'organizations-edit-status',
      submit: 'organizations-edit-submit',
      cancel: 'organizations-edit-cancel',
      statusOption: (status: string) =>
        `organizations-edit-dialog-status-option-${status}`,
    },

    // Subscription Form
    subscriptionForm: {
      container: 'organizations-subscription-form',
      addButton: 'organizations-subscription-add',
      removeButton: (index: number) =>
        `organizations-subscription-remove-${index}`,
      productSelect: (index: number) =>
        `organizations-subscription-product-${index}`,
      tierSelect: (index: number) => `organizations-subscription-tier-${index}`,
      startDate: (index: number) =>
        `organizations-subscription-start-date-${index}`,
      endDate: (index: number) =>
        `organizations-subscription-end-date-${index}`,
      subscriptionCard: (index: number) =>
        `organizations-subscription-card-${index}`,
      productSelectOption: (index: number, productId: string | number) =>
        `organizations-subscription-product-option-${index}-${productId}`,
      tierSelectOption: (index: number, tier: string) =>
        `organizations-subscription-tier-option-${index}-${tier}`,
    },

    // View Dialog
    viewDialog: {
      container: 'organizations-view-dialog',
      title: 'organizations-view-dialog-title',
      closeButton: 'organizations-view-close-button',
    },
  },

  // Users
  users: {
    page: 'users-page',
    table: 'users-table',
    createButton: 'users-create-button',
    viewDetails: (id: number) => `users-view-details-${id}`,
    edit: (id: number) => `users-edit-${id}`,
    deactivate: (id: number) => `users-deactivate-${id}`,
    updateRole: (userId: number) => `users-update-role-${userId}`,
    updateStatus: (userId: number) => `users-update-status-${userId}`,
    recordLogin: (userId: number) => `users-record-login-${userId}`,

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
      password: 'users-create-password',
      confirmPassword: 'users-create-confirm-password',
      submit: 'users-create-submit',
      cancel: 'users-create-cancel',
      error: 'users-create-error',
      domainOption: (domainId: string | number) =>
        `users-create-dialog-domain-option-${domainId}`,
      roleOption: (role: string) => `users-create-dialog-role-option-${role}`,
      organizationOption: (orgId: string) =>
        `users-create-dialog-organization-option-${orgId}`,
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
      roleOption: (role: string) => `users-edit-dialog-role-option-${role}`,
      statusOption: (status: string) =>
        `users-edit-dialog-status-option-${status}`,
      organizationOption: (orgId: number) =>
        `users-edit-dialog-organization-option-${orgId}`,
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
      organizationOption: (orgId: string) =>
        `subscriptions-create-dialog-organization-option-${orgId}`,
      productOption: (productId: string | number) =>
        `subscriptions-create-dialog-product-option-${productId}`,
      tierOption: (tier: string) =>
        `subscriptions-create-dialog-tier-option-${tier}`,
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
      tierOption: (tier: string) =>
        `subscriptions-edit-dialog-tier-option-${tier}`,
      statusOption: (status: string) =>
        `subscriptions-edit-dialog-status-option-${status}`,
    },

    // View Dialog
    viewDialog: {
      container: 'subscriptions-view-dialog',
      title: 'subscriptions-view-dialog-title',
      closeButton: 'subscriptions-view-close-button',
    },
  },

  // Transcripts
  transcripts: {
    page: 'transcripts-page',
    fileInput: 'transcripts-file-input',
    browseButton: 'transcripts-browse-button',
    submitButton: 'transcripts-submit-button',
    clearButton: 'transcripts-clear-button',
    responseDisplay: 'transcripts-response-display',
    progressBar: 'transcripts-progress-bar',
    detailedResultsButton: 'transcripts-detailed-results-button',
    retryButton: 'transcripts-retry-button',

    // Processing Information
    processingInfo: {
      container: 'transcripts-processing-info',
      jobId: 'transcripts-job-id',
      processingTime: 'transcripts-processing-time',
      firstPassConfidence: 'transcripts-first-pass-confidence',
      finalPassConfidence: 'transcripts-final-pass-confidence',
    },

    // Analysis Results
    analysisResults: {
      container: 'transcripts-analysis-results',
      firstPassContainer: 'transcripts-first-pass-container',
      finalPassContainer: 'transcripts-final-pass-container',
      documentInfoTable: 'transcripts-document-info-table',
      studentInfoTable: 'transcripts-student-info-table',
      academicSummaryTable: 'transcripts-academic-summary-table',
      dynamicTable: (passType: string, sectionKey: string) =>
        `transcripts-table-${passType}-${sectionKey}`,
    },
  },

  // Products
  products: {
    page: 'products-page',
    createButton: 'products-create-button',
    table: 'products-table',
    viewDetails: (productId: number) => `products-view-details-${productId}`,
    edit: (productId: number) => `products-edit-${productId}`,
    delete: (productId: number) => `products-delete-${productId}`,

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

  // Domain management
  addDomainButton: 'add-domain-button',
  domainNameInput: 'domain-name-input',
  createDomainButton: 'create-domain-button',
  editDomainButton: 'edit-domain-button',
  updateDomainButton: 'update-domain-button',
  deleteDomainButton: 'delete-domain-button',
  addSubdomainButton: 'add-subdomain-button',
  domainManagementSection: 'domain-management-section',

  // Organizations Dropdown
  organizationsDropdown: {
    select: 'organizations-dropdown-select',
    optionAll: 'organizations-dropdown-option-all',
    option: (orgId: string) => `organizations-dropdown-option-${orgId}`,
  },

  // Jobs Page
  jobs: {
    pageContainer: 'jobs-page-container',
    loadingSpinner: 'jobs-loading-spinner',
    errorAlert: 'jobs-error-alert',
    refreshButton: 'jobs-refresh-button',
    jobsTable: 'jobs-table',
    jobRow: (jobId: string | number) => `jobs-job-row-${jobId}`,
  },
};

// ──────────────────────────────────────────────────
// End of File: src/testIds.ts
// ──────────────────────────────────────────────────
