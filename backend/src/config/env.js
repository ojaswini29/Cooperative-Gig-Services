const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cooperative_gig_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_THIS_JWT_SECRET_IN_PRODUCTION',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  coop: {
    feePercentage: parseFloat(process.env.COOP_FEE_PERCENTAGE || '10'),
    welfarePercentage: parseFloat(process.env.WELFARE_FUND_PERCENTAGE || '5'),
  },
};
