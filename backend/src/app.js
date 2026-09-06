const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/error');
const { errorResponse } = require('./utils/response');

const app = express();

// Security and Logging Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root Route & Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Cooperative Gig Services Platform API',
    version: '1.0.0',
    documentation: '/api-docs',
    api_base: '/api/v1',
    database_status: 'EMPTY (No seed/demo data as per configuration)',
    timestamp: new Date().toISOString(),
  });
});

// Serve OpenAPI Spec and Swagger UI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount API v1 Routes
app.use('/api/v1', apiRoutes);

// 404 Route Handler
app.use((req, res) => {
  errorResponse(res, 404, `Route ${req.originalUrl} not found on this server`);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
