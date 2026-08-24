const app = require('./src/app');
const config = require('./src/config/env');
// Import models/index to register all associations before sync
const { sequelize } = require('./src/models');

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync all models — create tables if they don't exist
    // Use alter:true only for Postgres (Supabase) where ALTER COLUMN works properly
    // SQLite doesn't support ALTER for ENUMs and will fail with FK constraints
    const isPostgres = sequelize.getDialect() === 'postgres';
    await sequelize.sync(isPostgres ? { alter: true } : {});
    console.log('Database models synchronized successfully.');

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port} in ${config.env} mode.`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
