import dotenv from 'dotenv';

dotenv.config();

const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_PATH || './data/bookings.db',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './database/migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },
  production: {
    client: 'postgresql',
    // Si DATABASE_URL está definida, usarla directamente (formato: postgresql://user:pass@host:port/db)
    // Si no, usar variables individuales
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'milo_bookings',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './database/migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },
};

export default config;

