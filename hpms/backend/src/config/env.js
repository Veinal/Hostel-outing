export const validateEnv = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[FATAL ERROR] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};
