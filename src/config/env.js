import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  
  // Database
  DB: {
    URL: process.env.DATABASE_URL,
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '5432', 10),
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'postgres',
    NAME: process.env.DB_NAME || 'playce_db',
  },

  // Redis
  REDIS: {
    URL: process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null),
  },

  // JWT
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'playce_access_super_secret_jwt_key_2026',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'playce_refresh_super_secret_jwt_key_2026',
    RESET_SECRET: process.env.JWT_RESET_SECRET || 'playce_reset_super_secret_jwt_key_2026',
    ACCESS_EXPIRY: '30m',
    REFRESH_EXPIRY: '4h',
    RESET_EXPIRY: '15m',
  },

  // Resend
  RESEND: {
    API_KEY: process.env.RESEND_API_KEY || '',
    FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'Playce UI <onboarding@resend.dev>',
  },

  // Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  },

  // Swagger Basic Auth
  SWAGGER: {
    USER: process.env.SWAGGER_USER || 'admin',
    PASSWORD: process.env.SWAGGER_PASSWORD || 'playce_docs_pass',
  }
};
