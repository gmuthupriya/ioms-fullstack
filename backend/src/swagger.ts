export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Inventory & Order Management API',
    version: '1.0.0',
    description: 'Multi-tenant REST API for Products, Inventory, and Order Management.',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter a valid JWT Bearer token obtained from /api/v1/auth/login or /api/v1/auth/demo-accounts',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/v1/auth/login': {
      post: {
        summary: 'Obtain JWT token for tenant & role testing',
        security: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  tenantId: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'USER'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'JWT Token' } },
      },
    },
    '/api/v1/auth/demo-accounts': {
      get: {
        summary: 'List demo JWT accounts (Tenant Alpha & Tenant Beta)',
        security: [],
        responses: { 200: { description: 'Demo token accounts map' } },
      },
    },
    '/api/v1/products': {
      post: { summary: 'Create Product (ADMIN required)', responses: { 201: { description: 'Created' }, 403: { description: 'Forbidden for USER role' } } },
      get: { summary: 'List Products (ADMIN, USER)', responses: { 200: { description: 'Success' } } },
    },
    '/api/v1/products/{id}': {
      get: { summary: 'Get Product Details', responses: { 200: { description: 'Success' }, 404: { description: 'Not Found' } } },
      patch: { summary: 'Update Product (ADMIN required)', responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Deactivate Product (ADMIN required)', responses: { 200: { description: 'Deactivated' } } },
    },
    '/api/v1/products/{id}/inventory': {
      get: { summary: 'Get Inventory Levels', responses: { 200: { description: 'Success' } } },
    },
    '/api/v1/products/{id}/inventory/adjust': {
      post: { summary: 'Adjust Inventory Quantity (ADMIN required)', responses: { 200: { description: 'Adjusted' }, 400: { description: 'Negative stock violation' } } },
    },
    '/api/v1/orders': {
      post: { summary: 'Create Order (USER required)', responses: { 201: { description: 'Created' }, 409: { description: 'Insufficient stock conflict' } } },
      get: { summary: 'List Orders (USER sees own, ADMIN sees tenant)', responses: { 200: { description: 'Success' } } },
    },
    '/api/v1/orders/{id}': {
      get: { summary: 'Get Order Details', responses: { 200: { description: 'Success' }, 404: { description: 'Not Found' } } },
    },
    '/api/v1/orders/{id}/status': {
      patch: { summary: 'Update Order Status (ADMIN required)', responses: { 200: { description: 'Status Updated' }, 400: { description: 'Invalid transition' } } },
    },
    '/api/v1/payments': {
      post: { summary: 'Create Payment for Order (USER, ADMIN)', responses: { 201: { description: 'Payment Created' } } },
    },
    '/api/v1/payments/order/{orderId}': {
      get: { summary: 'Get Latest Payment for Order', responses: { 200: { description: 'Payment Details' } } },
    },
    '/api/v1/payments/{paymentId}': {
      get: { summary: 'Get Payment Details', responses: { 200: { description: 'Payment Details' } } },
    },
    '/api/v1/payments/{paymentId}/process': {
      post: { summary: 'Process Payment Result (SUCCESS, FAILED, CANCELLED)', responses: { 200: { description: 'Payment Result Processed & Order Updated' }, 400: { description: 'Already processed' } } },
    },
    '/health': {
      get: { summary: 'Health Probe', security: [], responses: { 200: { description: 'UP' } } },
    },
  },
};
