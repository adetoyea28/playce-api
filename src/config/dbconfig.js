import { Sequelize } from 'sequelize';
import { ENV } from './env.js';

const sequelize = new Sequelize(ENV.DB.URL, {
    dialect: 'postgres',
    logging: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
});

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
