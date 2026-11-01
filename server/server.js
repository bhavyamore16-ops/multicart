import dotenv from 'dotenv';
dotenv.config();
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedInitialAccounts } from './src/utils/seedData.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database (or initialize resilient fallback)
  await connectDB();

  // Ensure initial admin and vendor accounts exist
  await seedInitialAccounts();

  app.listen(PORT, () => {
    console.log(`[Server] MultiCart API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[Server] API Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch(err => {
  console.error('[Fatal Server Startup Error]', err);
  process.exit(1);
});
