const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'audit_assistant',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationFile = path.join(__dirname, '../migrations/add_query_scope_column.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Applying migration:', sql.trim());
    await client.query(sql);

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
