# Reusable Components Documentation

This document provides comprehensive documentation for the three reusable components created for the TondroAI CRM application.

## Table of Contents

1. [CreateDialog](#createdialog)
2. [EntityTable](#entitytable)
3. [FilterForm](#filterform)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)

---

## CreateDialog

A reusable dialog component for creating entities with form validation and dynamic field rendering.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls dialog visibility |
| `onClose` | `function` | - | Called when dialog is closed |
| `onSubmit` | `function` | - | Called with form data when submitted |
| `title` | `string` | - | Dialog title |
| `fields` | `array` | `[]` | Array of field configurations |
| `loading` | `boolean` | `false` | Shows loading state |
| `error` | `string` | `null` | Error message to display |
| `initialData` | `object` | `{}` | Initial form data |

### Field Configuration

Each field in the `fields` array should have the following properties:

```javascript
{
  name: 'fieldName',           // Required: Field identifier
  label: 'Field Label',        // Required: Display label
  type: 'text',               // Required: Field type
  required: false,            // Optional: Validation
  placeholder: 'Hint text',   // Optional: Placeholder text
  defaultValue: '',           // Optional: Default value
  fullWidth: false,           // Optional: Full width layout
  // Type-specific properties...
}
```

### Supported Field Types

#### Text Fields
```javascript
{
  name: 'name',
  label: 'Full Name',
  type: 'text',
  required: true,
  minLength: 2,
  maxLength: 50
}
```

#### Email Fields
```javascript
{
  name: 'email',
  label: 'Email Address',
  type: 'email',
  required: true
}
```

#### Select Fields
```javascript
{
  name: 'role',
  label: 'Role',
  type: 'select',
  required: true,
  options: [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' }
  ]
}
```

#### Textarea Fields
```javascript
{
  name: 'description',
  label: 'Description',
  type: 'textarea',
  rows: 4,
  fullWidth: true
}
```

#### Number Fields
```javascript
{
  name: 'age',
  label: 'Age',
  type: 'number',
  min: 0,
  max: 120,
  step: 1
}
```

### Usage Example

```javascript
const createUserFields = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    required: true
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'user', label: 'User' }
    ]
  }
];

<CreateDialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  onSubmit={handleCreateUser}
  title="Create New User"
  fields={createUserFields}
  loading={loading}
  error={error}
/>
```

---

## EntityTable

A reusable table component with sorting, pagination, and action buttons.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `array` | `[]` | Array of data objects |
| `columns` | `array` | `[]` | Column configurations |
| `loading` | `boolean` | `false` | Shows loading state |
| `error` | `string` | `null` | Error message to display |
| `pagination` | `object` | - | Pagination configuration |
| `onPageChange` | `function` | - | Called when page changes |
| `onPageSizeChange` | `function` | - | Called when page size changes |
| `onRefresh` | `function` | - | Called when refresh is clicked |
| `title` | `string` | `"Data Table"` | Table title |
| `showRefreshButton` | `boolean` | `true` | Show refresh button |
| `expandableRows` | `boolean` | `false` | Enable row expansion |
| `expandedRows` | `Set` | `new Set()` | Set of expanded row IDs |
| `emptyMessage` | `string` | `"No data available"` | Message when no data |

### Column Configuration

Each column should have the following properties:

```javascript
{
  key: 'fieldName',           // Required: Data field key
  label: 'Column Label',      // Required: Column header
  type: 'text',              // Optional: Data type for formatting
  sortable: true,            // Optional: Enable sorting
  actions: [],               // Optional: Action buttons
  expandable: null           // Optional: Expandable content config
}
```

### Supported Column Types

#### Basic Types
- `text` - Plain text
- `number` - Formatted numbers
- `date` - Date formatting
- `datetime` - Date and time formatting
- `boolean` - Yes/No display
- `email` - Clickable email links
- `url` - Clickable URLs

#### Special Types
- `status` - Color-coded status chips
- `chip` - Custom colored chips
- `currency` - Currency formatting

### Action Configuration

```javascript
{
  key: 'actions',
  label: 'Actions',
  actions: [
    {
      label: 'View',
      variant: 'outlined',
      color: 'primary',
      onClick: (row) => handleView(row),
      disabled: (row) => row.status === 'inactive',
      tooltip: 'View details'
    }
  ]
}
```

### Usage Example

```javascript
const columns = [
  {
    key: 'id',
    label: 'ID',
    type: 'number',
    sortable: true
  },
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Actions',
    actions: [
      {
        label: 'Edit',
        variant: 'outlined',
        color: 'primary',
        onClick: (row) => handleEdit(row)
      },
      {
        label: 'Delete',
        variant: 'outlined',
        color: 'error',
        onClick: (row) => handleDelete(row)
      }
    ]
  }
];

<EntityTable
  data={users}
  columns={columns}
  loading={loading}
  error={error}
  title="Users"
  pagination={{
    page: 0,
    pageSize: 50,
    total: 100
  }}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  onRefresh={fetchUsers}
/>
```

---

## FilterForm

A reusable filter form component with collapsible sections and multiple field types.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filters` | `array` | `[]` | Filter configurations |
| `onFilterChange` | `function` | - | Called when filters change |
| `onClearFilters` | `function` | - | Called when filters are cleared |
| `title` | `string` | `"Filters"` | Filter section title |
| `collapsible` | `boolean` | `true` | Enable collapsible behavior |
| `defaultExpanded` | `boolean` | `true` | Default expanded state |
| `showClearButton` | `boolean` | `true` | Show clear all button |
| `showApplyButton` | `boolean` | `false` | Show apply button |
| `onApply` | `function` | - | Called when apply is clicked |

### Filter Configuration

Each filter should have the following properties:

```javascript
{
  name: 'filterName',         // Required: Filter identifier
  label: 'Filter Label',      // Required: Display label
  type: 'text',              // Required: Filter type
  defaultValue: '',          // Optional: Default value
  placeholder: 'Hint text',  // Optional: Placeholder text
  fullWidth: false,          // Optional: Full width layout
  // Type-specific properties...
}
```

### Supported Filter Types

#### Search Filter
```javascript
{
  name: 'search',
  label: 'Search',
  type: 'search',
  placeholder: 'Search by name...'
}
```

#### Select Filter
```javascript
{
  name: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]
}
```

#### Multi-Select Filter
```javascript
{
  name: 'roles',
  label: 'Roles',
  type: 'multiselect',
  options: [
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' }
  ]
}
```

#### Date Filter
```javascript
{
  name: 'createdDate',
  label: 'Created Date',
  type: 'date'
}
```

#### Date Range Filter
```javascript
{
  name: 'dateRange',
  label: 'Date Range',
  type: 'daterange'
}
```

#### Number Filter
```javascript
{
  name: 'age',
  label: 'Age',
  type: 'number',
  min: 0,
  max: 120
}
```

#### Number Range Filter
```javascript
{
  name: 'priceRange',
  label: 'Price Range',
  type: 'numberrange',
  min: 0,
  max: 1000
}
```

### Usage Example

```javascript
const filters = [
  {
    name: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by name or email...'
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  {
    name: 'dateRange',
    label: 'Created Date',
    type: 'daterange'
  }
];

<FilterForm
  filters={filters}
  onFilterChange={handleFilterChange}
  onClearFilters={handleClearFilters}
  title="User Filters"
  collapsible={true}
  defaultExpanded={true}
/>
```

---

## Usage Examples

### Complete User Management Page

```javascript
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filter configuration
  const filterConfig = [
    {
      name: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by name or email...'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  // Table columns
  const columns = [
    { key: 'id', label: 'ID', type: 'number', sortable: true },
    { key: 'name', label: 'Name', type: 'text', sortable: true },
    { key: 'email', label: 'Email', type: 'email', sortable: true },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        {
          label: 'Edit',
          variant: 'outlined',
          color: 'primary',
          onClick: (user) => handleEdit(user)
        },
        {
          label: 'Delete',
          variant: 'outlined',
          color: 'error',
          onClick: (user) => handleDelete(user)
        }
      ]
    }
  ];

  // Create dialog fields
  const createFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users
      </Typography>

      <FilterForm
        filters={filterConfig}
        onFilterChange={setFilters}
        onClearFilters={() => setFilters({})}
        title="User Filters"
      />

      <EntityTable
        data={users}
        columns={columns}
        loading={loading}
        title="Users"
        onRefresh={fetchUsers}
      />

      <CreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
        title="Create New User"
        fields={createFields}
        loading={loading}
      />
    </Box>
  );
};
```

---

## Best Practices

### 1. Consistent Field Naming
Use consistent naming conventions for field names across all components:
- Use camelCase for field names
- Use descriptive names that match your data model
- Keep names consistent between filters, table columns, and form fields

### 2. Error Handling
Always provide proper error handling:
```javascript
<CreateDialog
  error={error}
  loading={loading}
  // ... other props
/>
```

### 3. Loading States
Show loading states during API calls:
```javascript
<EntityTable
  loading={loading}
  // ... other props
/>
```

### 4. Validation
Use the built-in validation features:
```javascript
{
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  minLength: 5
}
```

### 5. Responsive Design
Use the `fullWidth` property for important fields:
```javascript
{
  name: 'description',
  label: 'Description',
  type: 'textarea',
  fullWidth: true
}
```

### 6. Accessibility
- Always provide meaningful labels
- Use proper ARIA attributes where needed
- Ensure keyboard navigation works

### 7. Performance
- Use React.memo for components that don't need frequent updates
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary re-renders

---

## Migration Guide

### From Custom Components to Reusable Components

1. **Replace custom dialogs with CreateDialog**
2. **Replace custom tables with EntityTable**
3. **Replace custom filters with FilterForm**

### Example Migration

**Before (Custom Dialog):**
```javascript
<Dialog open={open} onClose={onClose}>
  <DialogTitle>Create User</DialogTitle>
  <DialogContent>
    <TextField label="Name" value={name} onChange={setName} />
    <TextField label="Email" value={email} onChange={setEmail} />
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button onClick={handleSubmit}>Create</Button>
  </DialogActions>
</Dialog>
```

**After (CreateDialog):**
```javascript
<CreateDialog
  open={open}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Create User"
  fields={[
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true }
  ]}
/>
```

This migration reduces code duplication and provides consistent behavior across the application. 