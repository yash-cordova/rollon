# Partner Login with Cookie Authentication

This document explains the partner login API that uses email/phone authentication and stores JWT token in HTTP-only cookies.

## Endpoint

```
POST /api/partners/login
```

## Authentication Methods

Partners can login using:
- **Email** + Password
- **Phone/Mobile Number** + Password

## Request

### Headers
```
Content-Type: application/json
```

### Body (Email Login)
```json
{
  "email": "service@abcauto.com",
  "password": "Password123"
}
```

### Body (Phone Login)
```json
{
  "phone": "9876543210",
  "password": "Password123"
}
```

OR

```json
{
  "mobileNumber": "9876543210",
  "password": "Password123"
}
```

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Login successful. Token stored in cookie.",
  "data": {
    "partner": {
      "_id": "507f1f77bcf86cd799439012",
      "shopName": "ABC Tire Shop",
      "ownerName": "Rajesh Kumar",
      "mobileNumber": "9876543210",
      "isApproved": true,
      "approvalStatus": "approved",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Note**: JWT token is automatically set in HTTP-only cookie named `partnerToken`. The token is NOT included in the JSON response for security.

### Error - Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email/phone or password"
}
```

### Error - Not Approved (401)
```json
{
  "success": false,
  "message": "Account is pending. Please contact admin for approval."
}
```

---

## Cookie Details

### Cookie Name
`partnerToken`

### Cookie Properties
- **HttpOnly**: `true` - Prevents JavaScript access (XSS protection)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `strict` - CSRF protection
- **MaxAge**: `7 days` (604800 seconds)

### Cookie Format
```
partnerToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

---

## Examples

### 1. Login with Email (cURL)

```bash
curl -X POST "http://localhost:5000/api/partners/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "service@abcauto.com",
    "password": "Password123"
  }'
```

**Note**: `-c cookies.txt` saves cookies to file for subsequent requests.

### 2. Login with Phone (cURL)

```bash
curl -X POST "http://localhost:5000/api/partners/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "phone": "9876543210",
    "password": "Password123"
  }'
```

### 3. Using Saved Cookies for Authenticated Request

```bash
curl -X GET "http://localhost:5000/api/partners/profile" \
  -b cookies.txt
```

**Note**: `-b cookies.txt` sends saved cookies with the request.

### 4. JavaScript (Fetch API)

```javascript
// Login
const loginPartner = async (emailOrPhone, password, isEmail = true) => {
  try {
    const response = await fetch('http://localhost:5000/api/partners/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important: Include cookies
      body: JSON.stringify({
        [isEmail ? 'email' : 'phone']: emailOrPhone,
        password: password
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Login successful:', result.data);
      // Cookie is automatically stored by browser
      return result.data;
    } else {
      console.error('Login failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};

// Usage - Email login
loginPartner('service@abcauto.com', 'Password123', true);

// Usage - Phone login
loginPartner('9876543210', 'Password123', false);

// Authenticated request (cookie sent automatically)
const getProfile = async () => {
  const response = await fetch('http://localhost:5000/api/partners/profile', {
    credentials: 'include' // Send cookies
  });
  return response.json();
};
```

### 5. React/Next.js Example

```javascript
// Login component
const PartnerLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isEmail, setIsEmail] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/partners/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          [isEmail ? 'email' : 'phone']: emailOrPhone,
          password
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Cookie is automatically stored
        // Redirect to dashboard
        window.location.href = '/partner/dashboard';
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error occurred');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type={isEmail ? 'email' : 'tel'}
        value={emailOrPhone}
        onChange={(e) => setEmailOrPhone(e.target.value)}
        placeholder={isEmail ? 'Email' : 'Phone Number'}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="button" onClick={() => setIsEmail(!isEmail)}>
        Switch to {isEmail ? 'Phone' : 'Email'}
      </button>
      <button type="submit">Login</button>
    </form>
  );
};
```

### 6. Axios Example

```javascript
import axios from 'axios';

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

// Login
const loginPartner = async (emailOrPhone, password, isEmail = true) => {
  try {
    const response = await axios.post('http://localhost:5000/api/partners/login', {
      [isEmail ? 'email' : 'phone']: emailOrPhone,
      password
    });
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return null;
  }
};

// Authenticated request (cookies sent automatically)
const getProfile = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/partners/profile');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
};
```

### 7. Postman Setup

1. **Method**: `POST`
2. **URL**: `http://localhost:5000/api/partners/login`
3. **Headers**:
   - `Content-Type`: `application/json`
4. **Body** (raw JSON):
   ```json
   {
     "email": "service@abcauto.com",
     "password": "Password123"
   }
   ```
   OR
   ```json
   {
     "phone": "9876543210",
     "password": "Password123"
   }
   ```
5. **Settings**:
   - Go to **Settings** → **General**
   - Enable **Automatically follow redirects**
   - Enable **Send cookies automatically**
6. **Click Send**

After login, Postman will automatically store the cookie. For subsequent requests:
- Cookies are sent automatically
- Or manually add: `Cookie: partnerToken=YOUR_TOKEN`

---

## Logout

### Endpoint
```
POST /api/partners/logout
```

### Example
```bash
curl -X POST "http://localhost:5000/api/partners/logout" \
  -b cookies.txt
```

### JavaScript
```javascript
const logout = async () => {
  await fetch('http://localhost:5000/api/partners/logout', {
    method: 'POST',
    credentials: 'include'
  });
  // Cookie is cleared
  window.location.href = '/login';
};
```

---

## Using Authenticated Endpoints

After login, the cookie is automatically sent with requests. No need to manually add Authorization header.

### Example: Get Profile

```bash
# Cookie is automatically sent
curl -X GET "http://localhost:5000/api/partners/profile" \
  -b cookies.txt
```

### JavaScript
```javascript
// Cookie sent automatically with credentials: 'include'
fetch('http://localhost:5000/api/partners/profile', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Important Notes

### 1. CORS Configuration
Make sure your frontend URL is configured in CORS:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true  // Required for cookies
}));
```

### 2. Cookie Security
- **HttpOnly**: Prevents XSS attacks (JavaScript cannot access)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Prevents CSRF attacks

### 3. Browser Compatibility
- Modern browsers automatically handle cookies
- Ensure `credentials: 'include'` in fetch/axios
- For cross-origin requests, CORS must allow credentials

### 4. Token Expiration
- Token expires in 7 days
- After expiration, login again
- Check for 401 responses to handle expired tokens

### 5. Fallback to Header
The auth middleware also checks `Authorization` header if cookie is not present:
```bash
# Still works with Authorization header
curl -X GET "http://localhost:5000/api/partners/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Cookie Not Being Set
1. Check CORS configuration (`credentials: true`)
2. Verify frontend URL matches CORS origin
3. Check browser console for CORS errors
4. Ensure `credentials: 'include'` in fetch requests

### Cookie Not Being Sent
1. Verify cookie domain/path settings
2. Check if cookie expired
3. Ensure `credentials: 'include'` in requests
4. Check browser cookie settings

### 401 Unauthorized After Login
1. Verify token is in cookie (check browser DevTools → Application → Cookies)
2. Check token expiration
3. Verify cookie name is `partnerToken`
4. Check if account is approved

---

## Security Best Practices

1. **Always use HTTPS in production** (Secure flag requires HTTPS)
2. **Never expose token in response body** (use cookies)
3. **Set appropriate SameSite policy** (prevents CSRF)
4. **Use HttpOnly flag** (prevents XSS)
5. **Implement token refresh** (optional, for better UX)
6. **Logout clears cookie** (always call logout endpoint)

---

## Testing

### Test Login with Email
```bash
curl -X POST "http://localhost:5000/api/partners/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "Test123"}'
```

### Test Login with Phone
```bash
curl -X POST "http://localhost:5000/api/partners/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"phone": "9876543210", "password": "Test123"}'
```

### Test Authenticated Request
```bash
curl -X GET "http://localhost:5000/api/partners/profile" \
  -b cookies.txt
```

### Test Logout
```bash
curl -X POST "http://localhost:5000/api/partners/logout" \
  -b cookies.txt
```

