import dns from 'node:dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

let isUsingFallback = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 80000,
      connectTimeoutMS: 100000
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    isUsingFallback = false;
    return conn;

  } catch (error) {
    console.log('[Database Error]', error.message);
    console.log('[Database] Activating in-memory fallback.');
    isUsingFallback = true;
    return null;
  }
};

export const getDBStatus = () => ({
  isFallback: isUsingFallback
});