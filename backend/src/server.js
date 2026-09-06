const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');
const runMigrations = require('./db/migrate');

async function startServer() {
  try {
    // Check DB Connection & Run Migrations
    await db.query('SELECT 1');
    console.log('PostgreSQL database connected successfully.');

    await runMigrations();

    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`==================================================`);
      console.log(`Cooperative Gig Services Backend API is running!`);
      console.log(`Server listening on 0.0.0.0:${env.port}`);
      console.log(`Swagger Docs available at http://0.0.0.0:${env.port}/api-docs`);
      console.log(`API Base URL: http://0.0.0.0:${env.port}/api/v1`);
      console.log(`Database Status: EMPTY (No demo data present)`);
      console.log(`==================================================`);
    });

    const gracefulShutdown = async () => {
      console.log('Initiating graceful shutdown...');
      server.close(async () => {
        console.log('HTTP server closed.');
        await db.pool.end();
        console.log('Database pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
