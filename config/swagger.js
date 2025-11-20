const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 4000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Aesthco Auth API',
    version: '1.0.0',
    description: 'Role-aware authentication API for the Aesthco platform.'
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`,
      description: 'Current environment'
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
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/**/*.js')
  ]
};

module.exports = swaggerJsdoc(options);
