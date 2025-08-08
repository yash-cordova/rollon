# Swagger API Documentation Integration

## Overview

The Rollon backend API is fully documented using **Swagger/OpenAPI 3.0** specification. This provides interactive API documentation that allows developers to:

- Explore all available endpoints
- Test API calls directly from the browser
- View request/response schemas
- Understand authentication requirements
- See example requests and responses

## Accessing the Documentation

### Development Environment
- **URL**: `http://localhost:5000/api-docs`
- **Base URL**: `http://localhost:5000/api`

### Production Environment
- **URL**: `https://api.rollon.in/api-docs`
- **Base URL**: `https://api.rollon.in/api`

## Features

### 🔐 Authentication
- **JWT Bearer Token**: Most endpoints require authentication
- **API Key**: Admin endpoints use API key authentication
- **OTP**: Phone verification endpoints

### 📊 API Categories

#### 1. Authentication (`/auth`)
- User registration and login
- Partner registration and login
- OTP verification
- Password reset functionality
- Admin login

#### 2. Users (`/users`)
- Profile management
- Location updates
- Vehicle details
- Nearby services search
- Booking history
- Emergency history

#### 3. Partners (`/partners`)
- Partner registration
- Profile management
- Service offerings
- Booking management
- Status updates

#### 4. Services (`/services`)
- Service listings
- Service categories
- Service details
- Provider search

#### 5. Bookings (`/bookings`)
- Create bookings
- Booking management
- Status updates
- Cancellation
- Feedback submission

#### 6. Emergency (`/emergency`)
- SOS requests
- Emergency tracking
- Location updates
- Nearby emergency providers

#### 7. Admin (`/admin`)
- Dashboard statistics
- User management
- Partner approval
- Booking analytics
- Emergency monitoring

## Using Swagger UI

### 1. Authentication
1. Click the **"Authorize"** button at the top
2. Enter your JWT token in the format: `Bearer your-token-here`
3. Click **"Authorize"**
4. Close the dialog

### 2. Testing Endpoints
1. Navigate to any endpoint
2. Click **"Try it out"**
3. Fill in the required parameters
4. Click **"Execute"**
5. View the response

### 3. Request Examples
Each endpoint includes:
- **Request Body Schema**: Detailed parameter descriptions
- **Response Examples**: Sample successful and error responses
- **Status Codes**: All possible response codes

## Configuration

### Swagger Setup
The Swagger configuration is located in `backend/src/config/swagger.js`:

```javascript
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rollon API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Rollon'
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};
```

### Server Integration
Swagger is integrated in `backend/src/server.js`:

```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rollon API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
  }
}));
```

## Documentation Standards

### Route Documentation
Each route is documented using JSDoc comments:

```javascript
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
```

### Schema Definitions
Common schemas are defined in the Swagger configuration:

```javascript
components: {
  schemas: {
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    }
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ErrorType",
  "statusCode": 400
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **500**: Internal Server Error

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information in response headers
- **Error**: 429 Too Many Requests when limit exceeded

## Development Workflow

### 1. Adding New Endpoints
1. Create the route in the appropriate file
2. Add Swagger documentation using JSDoc comments
3. Test the endpoint through Swagger UI
4. Update this documentation if needed

### 2. Updating Documentation
1. Modify the JSDoc comments in route files
2. Update schema definitions in `swagger.js`
3. Restart the server to see changes
4. Test the updated documentation

### 3. Testing
1. Start the development server: `npm run dev`
2. Open Swagger UI: `http://localhost:5000/api-docs`
3. Test endpoints with real data
4. Verify responses match documentation

## Troubleshooting

### Common Issues

1. **Swagger UI not loading**
   - Check if server is running
   - Verify port 5000 is available
   - Check browser console for errors

2. **Authentication not working**
   - Ensure JWT token is valid
   - Check token format: `Bearer <token>`
   - Verify token hasn't expired

3. **Endpoints not showing**
   - Check JSDoc comment syntax
   - Verify route files are in correct location
   - Restart server after changes

4. **Schema errors**
   - Validate JSON schema syntax
   - Check property definitions
   - Ensure required fields are marked

## Best Practices

1. **Keep Documentation Updated**: Update Swagger docs when changing APIs
2. **Use Descriptive Examples**: Provide realistic example data
3. **Include All Parameters**: Document all required and optional parameters
4. **Test Documentation**: Regularly test endpoints through Swagger UI
5. **Version Control**: Include documentation changes in commits

## Additional Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JSDoc Documentation](https://jsdoc.app/)

---

**Note**: This documentation is automatically generated and updated with the API. For the most current information, always refer to the live Swagger UI at the provided URLs.
