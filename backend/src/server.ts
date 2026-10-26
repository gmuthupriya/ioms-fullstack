import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/utils/logger.js';
import { prisma } from './db/client.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`API Documentation available at http://localhost:${env.PORT}/api-docs`);
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Draining HTTP server & DB connection pools...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Database client disconnected cleanly. Process exiting.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
