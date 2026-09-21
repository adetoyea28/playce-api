import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { connectDB } from './config/dbconfig.js';
import { initRedis } from './config/redisConfig.js';
import './models/index.js'; // Ensure associations are registered

import userRoute from './users/userRoute.js';
import venuesRoutes from './venues/venuesRoutes.js';
import bookingRoute from './bookings/bookingRoute.js';

import { generalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// API Documentation with Basic Auth Protection
const swaggerPath = path.join(__dirname, 'docs', 'swagger.yaml');
const swaggerDocument = YAML.load(swaggerPath);

const swaggerAuth = basicAuth({
  users: { [ENV.SWAGGER.USER]: ENV.SWAGGER.PASSWORD },
  challenge: true,
  realm: 'PlayceApiDocs',
});

app.use('/api-docs', swaggerAuth, swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Playce API Documentation',
}));

// Base Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Playce API - Event Venue Booking System for University of Ibadan',
    documentation: '/api-docs',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/v1/users', userRoute);
app.use('/api/v1/venues', venuesRoutes);
app.use('/api/v1/bookings', bookingRoute);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start Server & Connect Services
const startServer = async () => {
  try {
    await connectDB();
    await initRedis();

    app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(` Playce API is running on port ${ENV.PORT}`);
      console.log(` Environment: ${ENV.NODE_ENV}`);
      console.log(` API Docs available at: http://localhost:${ENV.PORT}/api-docs`);
      console.log(` Docs Username: ${ENV.SWAGGER.USER}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

const isDirectRun = process.argv[1] && (path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)));

if (isDirectRun) {
  startServer();
}

export { app, startServer };
export default app;