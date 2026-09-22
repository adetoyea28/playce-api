import { Sequelize } from 'sequelize';
import { ENV } from './env.js';

let sequelize;

if (ENV.DB.URL) {
  sequelize = new Sequelize(ENV.DB.URL, {
    dialect: 'postgres',
    logging: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  sequelize = new Sequelize(ENV.DB.NAME, ENV.DB.USER, ENV.DB.PASSWORD, {
    host: ENV.DB.HOST,
    port: ENV.DB.PORT,
    dialect: 'postgres',
    dialectOptions: ENV.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL database connection established successfully.');
    await sequelize.sync();
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }
};

export default sequelize;
