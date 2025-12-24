const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rollon API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Rollon - Bharat Ka Seva Mission - Vehicle Service Platform',
      contact: {
        name: 'Rollon Technologies Pvt. Ltd.',
        email: 'support@rollon.in',
        url: 'https://rollon.in'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.rollon.in/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for admin endpoints'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+919876543210' },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  example: [77.2090, 28.6139]
                }
              }
            },
            vehicleDetails: {
              type: 'object',
              properties: {
                make: { type: 'string', example: 'Honda' },
                model: { type: 'string', example: 'City' },
                year: { type: 'number', example: 2020 },
                registrationNumber: { type: 'string', example: 'DL01AB1234' }
              }
            },
            isVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Partner: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            shopName: { type: 'string', example: 'ABC Tire Shop', description: 'દુકાનનું નામ / दुकान का नाम' },
            ownerName: { type: 'string', example: 'Rajesh Kumar', description: 'વ્યવસાય માલિકનું નામ / व्यवसाय मालिक का नाम' },
            mobileNumber: { type: 'string', example: '9876543210', description: 'મોબાઈલ નંબર / मोबाइल नंबर' },
            whatsappNumber: { type: 'string', example: '9876543210', description: 'વોટ્સએપ નંબર / व्हाट्सएप नंबर' },
            shopAddress: { type: 'string', example: '123 Main Street, Ahmedabad, Gujarat 380001', description: 'દુકાનનું સરનામું / दुकान का पता' },
            googleMapsLink: { type: 'string', example: 'https://maps.google.com/?q=23.0225,72.5714' },
            tyreBrands: {
              type: 'array',
              items: { type: 'string', enum: ['MRF', 'Apollo', 'CEAT', 'Michelin', 'JK Tyre', 'Other'] },
              example: ['MRF', 'Apollo', 'CEAT'],
              description: 'વેચાતા ટાયર બ્રાન્ડ / बेचे जाने वाले टायर ब्रांड'
            },
            storePhoto: {
              type: 'object',
              properties: {
                contentType: { type: 'string', example: 'image/jpeg' },
                filename: { type: 'string', example: 'store-photo.jpg' },
                size: { type: 'number', example: 245678 }
              },
              description: 'Store photo metadata (binary data not included in response)'
            },
            priceList: {
              type: 'object',
              properties: {
                contentType: { type: 'string', example: 'application/pdf' },
                filename: { type: 'string', example: 'price-list.pdf' },
                size: { type: 'number', example: 456789 }
              },
              description: 'Price list metadata (binary data not included in response)'
            },
            businessName: { type: 'string', example: 'ABC Auto Service' },
            email: { type: 'string', format: 'email', example: 'service@abcauto.com' },
            phoneNumber: { type: 'string', example: '9876543210' },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  example: [72.5714, 23.0225]
                }
              }
            },
            services: {
              type: 'array',
              items: { type: 'string' },
              example: ['507f1f77bcf86cd799439013']
            },
            businessType: { type: 'string', enum: ['garage', 'tire_shop', 'petrol_pump', 'ev_charging', 'battery_swap', 'car_wash', 'towing', 'emergency_service', 'other'], example: 'tire_shop' },
            approvalStatus: { type: 'string', enum: ['pending', 'approved', 'rejected', 'suspended'], example: 'pending' },
            rating: { type: 'number', example: 4.5 },
            isApproved: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
            bookingId: { type: 'string', example: 'BK20231201001' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            partnerId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            serviceId: { type: 'string', example: '507f1f77bcf86cd799439013' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], example: 'confirmed' },
            scheduledTime: { type: 'string', format: 'date-time' },
            totalAmount: { type: 'number', example: 1500 },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'failed'], example: 'paid' }
          }
        },
        Emergency: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439015' },
            emergencyId: { type: 'string', example: 'EMG20231201001' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            emergencyType: { type: 'string', enum: ['breakdown', 'accident', 'flat-tire', 'out-of-fuel', 'other'], example: 'breakdown' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
            status: { type: 'string', enum: ['pending', 'assigned', 'responding', 'resolved', 'cancelled'], example: 'assigned' },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  example: [77.2090, 28.6139]
                }
              }
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            name: { type: 'string', example: 'Oil Change Service' },
            description: { type: 'string', example: 'Complete oil change with filter replacement' },
            category: { type: 'string', enum: ['maintenance', 'repair', 'emergency', 'inspection'], example: 'maintenance' },
            basePrice: { type: 'number', example: 800 },
            estimatedDuration: { type: 'number', example: 60 },
            isAvailable: { type: 'boolean', example: true }
          }
        },
        Admin: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439016' },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', format: 'email', example: 'admin@rollon.in' },
            role: { type: 'string', enum: ['super_admin', 'admin', 'moderator'], example: 'admin' },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['manage_users', 'manage_partners', 'view_analytics', 'manage_services']
            },
            isActive: { type: 'boolean', example: true },
            lastLogin: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'ValidationError' },
            statusCode: { type: 'number', example: 400 }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
