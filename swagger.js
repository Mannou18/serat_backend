const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Serat API Documentation',
      version: '1.0.0',
      description: 'API documentation for Car System',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fname: { type: 'string' },
            lname: { type: 'string' },
            phoneNumber: { type: 'string' }
          }
        },
        Car: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            plate_number: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            year: { type: 'integer' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Adjust paths to your controllers and routes
};

const specs = swaggerJsdoc(options);

module.exports = specs;
