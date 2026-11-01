import mongoose from 'mongoose';
import MongooseUser from './User.js';
import MongooseVendorProfile from './VendorProfile.js';
import MongooseProduct from './Product.js';
import MongooseCategory from './Category.js';
import { MemoryUser, MemoryVendorProfile, MemoryProduct, MemoryCategory } from '../config/memoryStore.js';

const isMongoConnected = () =>
  mongoose.connection && mongoose.connection.readyState === 1;

export const getUserModel = () =>
  isMongoConnected() ? MongooseUser : MemoryUser;

export const getVendorProfileModel = () =>
  isMongoConnected() ? MongooseVendorProfile : MemoryVendorProfile;

export const getProductModel = () =>
  isMongoConnected() ? MongooseProduct : MemoryProduct;

export const getCategoryModel = () =>
  isMongoConnected() ? MongooseCategory : MemoryCategory;
