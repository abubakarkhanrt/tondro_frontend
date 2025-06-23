# Environment Setup Guide

## Overview

This project uses environment variables for configuration management. Environment files are used to store sensitive information and configuration that varies between development and production environments.

## Environment Files

### Root Level (Proxy Server)

- `.env` - Development environment variables
- `.env.production` - Production environment variables
- `.env.example` - Example configuration (safe to commit)

### Client Level (React App)

- `client/.env` - React app environment variables
- `client/.env.example` - Example configuration (safe to commit)

## Setup Instructions

### 1. Copy Environment Files

```bash
# Copy example files to create your environment files
cp .env.example .env
cp client/.env.example client/.env
```

### 2. Configure Environment Variables

#### Root `.env` (Proxy Server)
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_BASE_URL=http://localhost:8081

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# Logging Configuration
LOG_LEVEL=info

# Security Configuration
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

#### Client `.env` (React App)
```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3000/api
REACT_APP_TIMEOUT=5000

# Development Configuration
REACT_APP_ENV=development
REACT_APP_DEBUG=true

# Feature Flags
REACT_APP_ENABLE_AUDIT_LOG=true
REACT_APP_ENABLE_DOMAIN_MANAGEMENT=true
```

### 3. Validate Environment

```bash
# Validate environment configuration
npm run env:validate
```

## Environment Variables Reference

### Server Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `API_BASE_URL` | Backend API URL | http://localhost:8081 | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3001,http://localhost:3000 | No |
| `LOG_LEVEL` | Logging level | info | No |
| `JWT_SECRET` | JWT signing secret | - | Yes (Production) |
| `SESSION_SECRET` | Session secret | - | Yes (Production) |

### Client Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_BASE_URL` | API base URL | http://localhost:3000/api | Yes |
| `REACT_APP_TIMEOUT` | API timeout (ms) | 5000 | No |
| `REACT_APP_ENV` | Environment mode | development | No |
| `REACT_APP_DEBUG` | Enable debug mode | true | No |
| `REACT_APP_ENABLE_AUDIT_LOG` | Enable audit log feature | true | No |
| `REACT_APP_ENABLE_DOMAIN_MANAGEMENT` | Enable domain management | true | No |

## Security Notes

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong secrets** in production
3. **Rotate secrets regularly** in production
4. **Use different secrets** for different environments

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure production API URLs
3. Set strong JWT and session secrets
4. Configure proper CORS origins
5. Set appropriate log levels

## Troubleshooting

### Environment Not Loading

1. Check file paths and names
2. Ensure `.env` files are in the correct directories
3. Verify file permissions
4. Run `npm run env:validate` to check configuration

### Missing Variables

1. Check `.env.example` files for required variables
2. Ensure all required variables are set
3. Check for typos in variable names

### CORS Issues

1. Verify `CORS_ORIGIN` includes your frontend URL
2. Check that origins are comma-separated
3. Ensure no trailing slashes in URLs

## Development Workflow

1. Copy `.env.example` to `.env`
2. Configure variables for your environment
3. Run `npm run env:validate` to verify
4. Start development server with `npm run dev`

## Environment Configuration in Code

The project uses a centralized environment configuration:

```typescript
// client/src/config/env.ts
import { ENV_CONFIG } from '@/config/env';

// Use environment variables
const apiUrl = ENV_CONFIG.API_BASE_URL;
const timeout = ENV_CONFIG.API_TIMEOUT;
```

This ensures type safety and centralized configuration management. 