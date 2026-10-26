import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { errorHandler } from './shared/middleware/error.middleware.js';
import { createAuthRouter } from './modules/auth/auth.router.js';
import { createProductRouter } from './modules/products/product.router.js';
import { createInventoryRouter } from './modules/inventory/inventory.router.js';
import { createOrderRouter } from './modules/orders/order.router.js';
import { paymentRouter } from './modules/payments/payment.router.js';
import { swaggerDocument } from './swagger.js';

export function createApp(): express.Application {
  const app = express();

  // 1. Security Headers & CORS
  app.use(helmet());
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('CORS policy violation'));
        }
      },
      credentials: true,
    })
  );

  // 2. Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // 3. Body Parsing
  app.use(express.json());

  // 4. API Docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // 5. Health Check Endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Inventory & Order Management API',
    });
  });

  // 6. Mount Domain Routers
  app.use('/api/v1/auth', createAuthRouter());
  app.use('/api/v1/products', createProductRouter());
  app.use('/api/v1/products', createInventoryRouter());
  app.use('/api/v1/orders', createOrderRouter());
  app.use('/api/v1/payments', paymentRouter);

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
