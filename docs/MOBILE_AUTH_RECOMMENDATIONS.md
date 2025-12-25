# Mobile App Authentication - Best Practices & Recommendations

This document provides recommendations for implementing authentication in mobile apps (React Native, Flutter, etc.) for the Rollon platform.

## 🔐 Authentication Methods Comparison

### 1. JWT with Secure Storage (Recommended for Mobile)

**Pros:**
- ✅ Stateless (no server-side session storage)
- ✅ Works offline (token cached locally)
- ✅ Scalable (no session database)
- ✅ Standard and widely supported
- ✅ Can include user data in token payload

**Cons:**
- ❌ Token revocation requires blacklist (or wait for expiry)
- ❌ Token size can be large if payload is big
- ❌ Need secure storage mechanism

**Best For:** Most mobile apps, especially when you need offline support

---

### 2. OAuth 2.0 / OpenID Connect

**Pros:**
- ✅ Industry standard
- ✅ Supports refresh tokens
- ✅ Better token lifecycle management
- ✅ Can integrate with social logins

**Cons:**
- ❌ More complex implementation
- ❌ Requires additional endpoints
- ❌ More overhead for simple apps

**Best For:** Apps requiring social login or enterprise SSO

---

### 3. Session-based (Cookie-based)

**Pros:**
- ✅ Simple server-side revocation
- ✅ Automatic cookie handling in web
- ✅ Secure with HttpOnly flag

**Cons:**
- ❌ Not ideal for mobile (cookies need manual handling)
- ❌ Requires session storage
- ❌ Less scalable

**Best For:** Web applications, not recommended for mobile

---

### 4. API Key / Token-based

**Pros:**
- ✅ Simple implementation
- ✅ Easy to revoke
- ✅ Good for server-to-server

**Cons:**
- ❌ Less secure (long-lived tokens)
- ❌ No expiration by default
- ❌ Not user-friendly

**Best For:** Server-to-server communication, not user authentication

---

## 🏆 Recommended Approach: JWT with Refresh Tokens

For mobile apps, we recommend **JWT with Refresh Token pattern**:

### Architecture

```
┌─────────────┐
│ Mobile App  │
└──────┬──────┘
       │
       │ 1. Login (email/phone + password)
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │
       │ 2. Return: Access Token (short-lived) + Refresh Token (long-lived)
       ▼
┌─────────────┐
│ Mobile App  │
│             │
│ Store:      │
│ - Access    │
│   Token     │
│ - Refresh   │
│   Token     │
└─────────────┘
```

### Token Types

1. **Access Token (JWT)**
   - Short-lived (15 minutes - 1 hour)
   - Stored in secure storage
   - Sent with every API request
   - Contains user/partner info

2. **Refresh Token**
   - Long-lived (7-30 days)
   - Stored in secure storage
   - Used only to get new access tokens
   - Can be revoked server-side

---

## 📱 Implementation for Mobile Apps

### Option 1: JWT in Authorization Header (Recommended)

**How it works:**
- Store JWT in secure storage (Keychain/Keystore)
- Send token in `Authorization: Bearer <token>` header
- Implement token refresh when expired

**Pros:**
- ✅ Works with existing API
- ✅ Standard approach
- ✅ Easy to implement
- ✅ Good security with secure storage

**Cons:**
- ❌ Need to handle token refresh
- ❌ Manual token management

**Implementation:**

```javascript
// React Native Example
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

// Store token securely
const storeToken = async (token) => {
  await Keychain.setGenericPassword('partnerToken', token);
};

// Get token
const getToken = async () => {
  const credentials = await Keychain.getGenericPassword();
  return credentials ? credentials.password : null;
};

// API call with token
const apiCall = async (url, options = {}) => {
  const token = await getToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

---

### Option 2: JWT in Cookie (Alternative)

**How it works:**
- Login sets cookie
- Cookie automatically sent with requests
- Works if using WebView or similar

**Pros:**
- ✅ Automatic token management
- ✅ No manual header setting
- ✅ Works well with web views

**Cons:**
- ❌ Limited support in native apps
- ❌ Requires cookie handling library
- ❌ Cross-domain issues

**Best For:** Hybrid apps (React Native WebView, Ionic)

---

## 🔒 Secure Storage Options

### React Native

#### 1. react-native-keychain (Recommended)
```bash
npm install react-native-keychain
```

**Pros:**
- Uses iOS Keychain / Android Keystore
- Hardware-backed encryption
- Most secure option

**Example:**
```javascript
import * as Keychain from 'react-native-keychain';

// Store
await Keychain.setGenericPassword('partnerToken', token);

// Retrieve
const credentials = await Keychain.getGenericPassword();
const token = credentials.password;

// Delete
await Keychain.resetGenericPassword();
```

#### 2. @react-native-async-storage/async-storage
```bash
npm install @react-native-async-storage/async-storage
```

**Pros:**
- Simple to use
- Cross-platform

**Cons:**
- Less secure (not hardware-backed)
- Can be accessed if device is compromised

**Example:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store
await AsyncStorage.setItem('partnerToken', token);

// Retrieve
const token = await AsyncStorage.getItem('partnerToken');

// Delete
await AsyncStorage.removeItem('partnerToken');
```

### Flutter

#### 1. flutter_secure_storage (Recommended)
```yaml
dependencies:
  flutter_secure_storage: ^9.0.0
```

**Example:**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Store
await storage.write(key: 'partnerToken', value: token);

// Retrieve
String? token = await storage.read(key: 'partnerToken');

// Delete
await storage.delete(key: 'partnerToken');
```

---

## 🎯 Recommended Implementation Strategy

### Phase 1: Current Setup (JWT in Header)

**What we have:**
- JWT token generation
- Token in response (can be stored by mobile app)
- Auth middleware checks Authorization header

**Mobile App Implementation:**
1. Login → Get token from response
2. Store token in secure storage
3. Send token in `Authorization: Bearer <token>` header
4. Handle 401 errors (token expired) → Re-login

**Pros:**
- ✅ Works immediately
- ✅ Simple implementation
- ✅ No backend changes needed

---

### Phase 2: Enhanced (JWT + Refresh Token)

**Backend Changes Needed:**
- Add refresh token generation
- Add refresh token endpoint
- Store refresh tokens in database (for revocation)
- Update login to return both tokens

**Mobile App Implementation:**
1. Login → Get access token + refresh token
2. Store both in secure storage
3. Use access token for API calls
4. When access token expires (401):
   - Use refresh token to get new access token
   - Retry original request
5. If refresh fails → Re-login

**Pros:**
- ✅ Better UX (less frequent logins)
- ✅ Can revoke refresh tokens
- ✅ More secure (short-lived access tokens)

---

## 📋 Implementation Guide

### Current API (Works Now)

#### Login Endpoint
```
POST /api/partners/login
Body: { "phone": "9876543210", "password": "Password123" }
Response: { "success": true, "data": { "partner": {...}, "token": "..." } }
```

#### Mobile App Code (React Native)
```javascript
// Login
const login = async (phone, password) => {
  const response = await fetch('http://localhost:5000/api/partners/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Store token securely
    await Keychain.setGenericPassword('partnerToken', result.data.token);
    return result.data;
  }
  throw new Error(result.message);
};

// Authenticated API call
const apiCall = async (url, options = {}) => {
  const credentials = await Keychain.getGenericPassword();
  const token = credentials?.password;
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Handle token expiration
  if (response.status === 401) {
    // Clear token and redirect to login
    await Keychain.resetGenericPassword();
    throw new Error('Session expired. Please login again.');
  }
  
  return response.json();
};
```

---

## 🔄 Enhanced Implementation (Refresh Tokens)

### Backend Changes

#### 1. Update Login to Return Refresh Token

```javascript
// In partners.js login route
const accessToken = jwt.sign(
  { partnerId: partner._id, role: 'partner' },
  process.env.JWT_SECRET,
  { expiresIn: '15m' } // Short-lived
);

const refreshToken = jwt.sign(
  { partnerId: partner._id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' } // Long-lived
);

// Store refresh token in database
partner.refreshToken = refreshToken;
await partner.save();

// Return both tokens
res.json({
  success: true,
  data: {
    partner: partnerResponse,
    accessToken,
    refreshToken
  }
});
```

#### 2. Add Refresh Token Endpoint

```javascript
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
  // Check if token exists in database
  const partner = await Partner.findOne({
    _id: decoded.partnerId,
    refreshToken: refreshToken
  });
  
  if (!partner) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  
  // Generate new access token
  const newAccessToken = jwt.sign(
    { partnerId: partner._id, role: 'partner' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  res.json({
    success: true,
    accessToken: newAccessToken
  });
});
```

### Mobile App Implementation

```javascript
// Store tokens
const storeTokens = async (accessToken, refreshToken) => {
  await Keychain.setGenericPassword('accessToken', accessToken);
  await Keychain.setGenericPassword('refreshToken', refreshToken);
};

// Refresh access token
const refreshAccessToken = async () => {
  const credentials = await Keychain.getGenericPassword();
  const refreshToken = credentials?.password; // Get refresh token
  
  const response = await fetch('http://localhost:5000/api/partners/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const result = await response.json();
  
  if (result.success) {
    await Keychain.setGenericPassword('accessToken', result.accessToken);
    return result.accessToken;
  }
  
  throw new Error('Token refresh failed');
};

// API call with auto-refresh
const apiCall = async (url, options = {}) => {
  const credentials = await Keychain.getGenericPassword();
  let accessToken = credentials?.password;
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // If token expired, refresh and retry
  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    
    // Retry original request
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  return response.json();
};
```

---

## 🛡️ Security Best Practices

### 1. Token Storage
- ✅ Use hardware-backed secure storage (Keychain/Keystore)
- ❌ Never store tokens in plain text
- ❌ Never log tokens
- ❌ Never store in AsyncStorage without encryption

### 2. Token Transmission
- ✅ Always use HTTPS in production
- ✅ Use `Authorization: Bearer` header
- ❌ Never send tokens in URL parameters
- ❌ Never send tokens in query strings

### 3. Token Lifecycle
- ✅ Use short-lived access tokens (15 min - 1 hour)
- ✅ Use long-lived refresh tokens (7-30 days)
- ✅ Implement token rotation
- ✅ Revoke tokens on logout

### 4. Error Handling
- ✅ Handle 401 (Unauthorized) gracefully
- ✅ Auto-refresh tokens when expired
- ✅ Clear tokens on logout
- ✅ Redirect to login on auth failure

---

## 📊 Comparison Table

| Method | Security | UX | Complexity | Offline Support | Recommendation |
|--------|----------|----|----|-----------------|----------------|
| **JWT in Header** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes | ✅ **Best for most apps** |
| **JWT + Refresh** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Yes | ✅ **Best for production** |
| **OAuth 2.0** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⚠️ Limited | ✅ For enterprise/social |
| **Cookies** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ No | ❌ Not ideal for mobile |
| **API Key** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Yes | ❌ Not for user auth |

---

## 🎯 Final Recommendation

### For Rollon Mobile App:

**Recommended: JWT with Refresh Token Pattern**

**Why:**
1. ✅ Best security (short-lived access tokens)
2. ✅ Better UX (less frequent logins)
3. ✅ Works offline (cached tokens)
4. ✅ Scalable (stateless)
5. ✅ Industry standard

**Implementation Steps:**

1. **Phase 1 (Current - Works Now):**
   - Use JWT in Authorization header
   - Store in secure storage (Keychain/Keystore)
   - Handle 401 → Re-login

2. **Phase 2 (Enhanced - Recommended):**
   - Add refresh token endpoint
   - Implement token refresh logic
   - Auto-refresh on 401

**Storage:**
- React Native: `react-native-keychain`
- Flutter: `flutter_secure_storage`
- Both use hardware-backed encryption

---

## 🔧 Quick Implementation Checklist

### Backend (Current - Works)
- [x] JWT token generation
- [x] Login endpoint (email/phone)
- [x] Auth middleware
- [ ] Add refresh token endpoint (optional enhancement)

### Mobile App
- [ ] Install secure storage library
- [ ] Implement login flow
- [ ] Store token securely
- [ ] Add token to API requests
- [ ] Handle token expiration
- [ ] Implement logout (clear token)

---

## 📚 Additional Resources

- **React Native Keychain**: https://github.com/oblador/react-native-keychain
- **Flutter Secure Storage**: https://pub.dev/packages/flutter_secure_storage
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **OWASP Mobile Security**: https://owasp.org/www-project-mobile-security/

---

## 💡 Summary

**For your mobile app, I recommend:**

1. **Use JWT in Authorization Header** (works with current API)
2. **Store tokens in secure storage** (Keychain/Keystore)
3. **Implement refresh token pattern** (for better UX)
4. **Always use HTTPS** in production
5. **Handle token expiration** gracefully

The current API already supports this! Just store the token from login response and send it in the Authorization header.

