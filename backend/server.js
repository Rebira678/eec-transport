const app = require('./src/app');
const config = require('./src/config/env');
const sequelize = require('./src/config/database');

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // We will sync models elsewhere via migrations, but for simple dev we could do sequelize.sync()
    // Avoid syncing here for now to rely on migrations

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port} in ${config.env} mode.`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
