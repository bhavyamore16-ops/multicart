import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import { seedInitialAccounts } from './seedData.js';

const run = async () => {
  await connectDB();
  await seedInitialAccounts();
  console.log('[Seed] Standalone seed run complete.');
  process.exit(0);
};

run();
