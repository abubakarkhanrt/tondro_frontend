# TondroAI CRM Frontend

A modern React/Next.js CRM application with component-specific services and modular architecture.

## 🏗️ Project Structure

```
crm_frontend/
├── src/
│   ├── components/          # React components
│   │   ├── organizations.ts
│   │   ├── users.ts
│   │   ├── subscriptions.ts
│   │   ├── products.ts
│   │   ├── audit-log.ts
│   │   ├── auth.ts
│   │   ├── domains.ts
│   │   ├── health.ts
│   │   └── index.ts        # Service exports
│   ├── lib/                # Shared libraries
│   │   └── api-client.ts   # Base API client
│   ├── hooks/              # Custom React hooks
│   │   ├── useApi.ts       # API call hook
│   │   └── usePagination.ts # Pagination hook
│   ├── types/              # TypeScript types
│   │   └── shared.ts       # Shared types
│   ├── utils/              # Utility functions
│   │   └── global-messages/ # Global message system
│   ├── config/             # Configuration
│   └── contexts/           # React contexts
├── pages/                  # Next.js pages
└── public/                 # Static assets
```

## 🚀 Features

- **Component-Specific Services**: Each component has its own service with dedicated types and API calls
- **Modular Architecture**: Clean separation of concerns with dedicated services for each domain
- **Type Safety**: Full TypeScript support with component-specific type definitions
- **Global Message System**: Centralized error and success message handling
- **Custom Hooks**: Reusable hooks for API calls and pagination
- **Modern React Patterns**: Using latest React and Next.js best practices

## 🛠️ Services Architecture

### Base API Client (`src/lib/api-client.ts`)

- Centralized Axios configuration
- Request/response interceptors
- Authentication token handling
- Error handling and redirects

### Component-Specific Services

Each service contains:

- **Types**: Domain-specific TypeScript interfaces
- **API Methods**: CRUD operations and business logic
- **Error Handling**: Service-specific error management

#### Available Services:

- `OrganizationsService` - Organization management
- `UsersService` - User management
- `SubscriptionsService` - Subscription handling
- `ProductsService` - Product catalog
- `AuditLogService` - Audit trail
- `AuthService` - Authentication
- `DomainsService` - Domain management
- `HealthService` - System health checks

### Custom Hooks

#### `useApi<T>`

```typescript
const { data, loading, error, refetch } = useApi(
  () => OrganizationsService.getOrganizations(),
  { immediate: true }
);
```

#### `usePagination`

```typescript
const { pagination, handlePageChange, handlePageSizeChange } = usePagination({
  initialPage: 1,
  initialPageSize: 10,
});
```

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
npm run dev
```

## 🏗️ Building

```bash
npm run build
```

## 🧪 Testing

```bash
npm test
```

## 📝 Usage Examples

### Using Component-Specific Services

```typescript
import {
  OrganizationsService,
  type Organization,
} from '../services/organizations';

// Fetch organizations
const response = await OrganizationsService.getOrganizations({
  page: 1,
  limit: 10,
});

// Create organization
const newOrg = await OrganizationsService.createOrganization({
  tenantName: 'My Company',
  organizationDomain: 'mycompany.com',
  initialAdminEmail: 'admin@mycompany.com',
  initialSubscriptions: [],
});
```

### Using Custom Hooks

```typescript
import { useApi } from '../hooks/useApi';
import { OrganizationsService } from '../services/organizations';

const MyComponent = () => {
  const { data, loading, error, refetch } = useApi(
    () => OrganizationsService.getOrganizations(),
    { immediate: true }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
};
```

### Using Global Messages

```typescript
import { globalMessages } from '../utils/global-messages';

// Show success message
globalMessages.showSuccess('Operation completed successfully');

// Show error message
globalMessages.showError('Something went wrong');
```

## 🔧 Configuration

Environment variables are configured in `src/config/env.ts`:

```typescript
export const ENV_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081',
  AUTH_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001',
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
  JWT_STORAGE_KEY: process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'jwt_token',
  USER_EMAIL_STORAGE_KEY:
    process.env.NEXT_PUBLIC_USER_EMAIL_STORAGE_KEY || 'user_email',
};
```

## 🎯 Best Practices

1. **Service Isolation**: Each component should use its own service
2. **Type Safety**: Always use TypeScript interfaces from services
3. **Error Handling**: Use the global message system for user feedback
4. **Custom Hooks**: Leverage `useApi` and `usePagination` for common patterns
5. **Abort Controllers**: Always handle request cancellation properly

## 🤝 Contributing

1. Follow the existing service structure
2. Add types to the appropriate service file
3. Use the global message system for user feedback
4. Write TypeScript interfaces for all data structures
5. Follow the established naming conventions

## 📄 License

This project is proprietary to TondroAI.
