# Partner Login - Quick Reference

## ✅ What Changed

1. **Login accepts email OR phone** (not just email)
2. **JWT token stored in HTTP-only cookie** (not in response body)
3. **Auth middleware checks cookies** (in addition to Authorization header)
4. **Added logout endpoint** to clear cookie

---

## Quick Examples

### Login with Email
```bash
curl -X POST "http://localhost:5000/api/partners/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "service@abcauto.com", "password": "Password123"}'
```

### Login with Phone
```bash
curl -X POST "http://localhost:5000/api/partners/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"phone": "9876543210", "password": "Password123"}'
```

### Use Authenticated Endpoint (Cookie Auto-Sent)
```bash
curl -X GET "http://localhost:5000/api/partners/profile" \
  -b cookies.txt
```

### Logout
```bash
curl -X POST "http://localhost:5000/api/partners/logout" \
  -b cookies.txt
```

---

## JavaScript Example

```javascript
// Login
fetch('http://localhost:5000/api/partners/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    phone: '9876543210', // or email: 'service@abcauto.com'
    password: 'Password123'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));

// Authenticated request (cookie sent automatically)
fetch('http://localhost:5000/api/partners/profile', {
  credentials: 'include' // Send cookies
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Installation Required

```bash
cd backend
npm install cookie-parser
```

---

## Cookie Details

- **Name**: `partnerToken`
- **HttpOnly**: Yes (XSS protection)
- **Secure**: Yes in production (HTTPS only)
- **SameSite**: Strict (CSRF protection)
- **Expires**: 7 days

---

See `docs/PARTNER_LOGIN_COOKIE.md` for complete documentation.

