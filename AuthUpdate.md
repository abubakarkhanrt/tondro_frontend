Here's a comprehensive prompt for a frontend AI-based IDE to accommodate the authentication flow changes:

---

## **Frontend Authentication Integration Prompt**

### **Context**
We've updated our backend API authentication system from a simple mock token endpoint to a proper login flow. The frontend needs to be updated to work with the new authentication system.

### **Backend Changes Summary**
- **Removed:** `GET /api/crm/mock-token` (old mock token generation)
- **Added:** `POST /api/crm/auth/login` (new login endpoint)
- **Credentials:** `admin` / `admin123` (for development)

### **New Authentication Flow**

#### **1. Login Request**
```typescript
// POST /api/crm/auth/login
interface LoginRequest {
  username: string;
  password: string;
}
```

#### **2. Login Response**
```typescript
interface LoginResponse {
  access_token: string;
  token_type: string; // "bearer"
  expires_in: number; // seconds (86400 for 24 hours)
  user: {
    id: string;
    username: string;
  };
}
```

#### **3. Error Responses**
- **401:** Invalid credentials
- **422:** Validation errors (missing/invalid fields)

### **Required Frontend Updates**

#### **1. Authentication Service/Store**
```typescript
// Update your auth service to use the new login endpoint
class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/crm/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 401) {
      throw new Error('Invalid username or password');
    }

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  // Update token storage to use access_token instead of token
  setToken(loginResponse: LoginResponse) {
    localStorage.setItem('access_token', loginResponse.access_token);
    localStorage.setItem('token_type', loginResponse.token_type);
    localStorage.setItem('user', JSON.stringify(loginResponse.user));
  }

  getAuthHeader(): string {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type') || 'bearer';
    return token ? `${tokenType} ${token}` : '';
  }
}
```

#### **2. API Client Updates**
```typescript
// Update your API client to use the new token format
class ApiClient {
  private getHeaders(): HeadersInit {
    const authHeader = this.authService.getAuthHeader();
    return {
      'Content-Type': 'application/json',
      ...(authHeader && { 'Authorization': authHeader }),
    };
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      // Handle token expiration
      this.authService.logout();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    return response.json();
  }
}
```

#### **3. Login Component Updates**
```typescript
// Update your login form to handle the new response format
const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const loginResponse = await authService.login(
        credentials.username, 
        credentials.password
      );
      
      // Store the new token format
      authService.setToken(loginResponse);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials(prev => ({ 
          ...prev, 
          username: e.target.value 
        }))}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials(prev => ({ 
          ...prev, 
          password: e.target.value 
        }))}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
};
```

#### **4. Route Protection Updates**
```typescript
// Update your protected route logic
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token is still valid (optional)
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

#### **5. Logout Function Updates**
```typescript
// Update logout to clear new token format
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('user');
  // Navigate to login
  window.location.href = '/login';
};
```

### **Testing Instructions**

#### **1. Test Login Flow**
```bash
# Test with correct credentials
curl -X POST "http://localhost:8081/api/crm/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Expected response:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "admin_user",
    "username": "admin"
  }
}
```

#### **2. Test Protected Endpoints**
```bash
# Use the access_token in Authorization header
curl -X GET "http://localhost:8081/api/crm/organizations" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Migration Checklist**

- [ ] Update authentication service to use new login endpoint
- [ ] Update token storage to use `access_token` instead of `token`
- [ ] Update API client to use new Authorization header format
- [ ] Update login form to handle new response structure
- [ ] Update logout function to clear new token format
- [ ] Update route protection logic
- [ ] Test login with `admin` / `admin123` credentials
- [ ] Test protected endpoints with new token format
- [ ] Remove any references to old mock token endpoint
- [ ] Update error handling for 401/422 responses

### **Key Differences from Old System**

| Old System | New System |
|------------|------------|
| `GET /api/crm/mock-token` | `POST /api/crm/auth/login` |
| `{ token, expires_in }` | `{ access_token, token_type, expires_in, user }` |
| No credentials required | Username/password required |
| Simple token storage | Structured token + user storage |

### **Error Handling Notes**

- **401 Unauthorized:** Invalid credentials or expired token
- **422 Validation Error:** Missing username/password or invalid format
- **Network Errors:** Handle fetch failures gracefully

### **Security Considerations**

- Store tokens securely (localStorage for development, httpOnly cookies for production)
- Implement token refresh logic for production
- Clear tokens on logout
- Handle token expiration gracefully
- Validate token format before using

---

**Please implement these changes in your frontend codebase to ensure compatibility with the updated backend authentication system.**
