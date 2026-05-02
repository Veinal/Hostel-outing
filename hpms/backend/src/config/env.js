import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['DATABASE_URL'];

export const validateEnv = () => {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Warning: Missing required environment variable ${envVar}`);
    }
  }
};

validateEnv();
