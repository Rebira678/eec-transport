/**
 * migrate.js — Drops and recreates all tables in the correct order.
 * Run with: npm run migrate
 * WARNING: This will DROP all existing data.
 */
const { sequelize } = require('../src/models');

(async () => {
  try {
    console.log('Starting database migration (force sync)...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
})();
