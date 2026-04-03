import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import { initSocketIO } from './sockets/index.js';
import { startAlertWorker } from './jobs/workers/alertWorker.js';
import { startIncidentWorker } from './jobs/workers/incidentWorker.js';
import './jobs/workers/evidenceCleanupWorker.js'; // registers worker + cron on import

const httpServer = http.createServer(app);

// Attach Socket.io to the HTTP server (must happen before listen)
initSocketIO(httpServer);

// Start BullMQ workers
startAlertWorker();
startIncidentWorker();

const start = async () => {
  try {
    await testConnection();

    httpServer.listen(env.PORT, () => {
      console.log(`\n🛡️  SafeTraiL API running on port ${env.PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Health:      http://localhost:${env.PORT}/health`);
      console.log(`   API Base:    http://localhost:${env.PORT}/api\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

start();
