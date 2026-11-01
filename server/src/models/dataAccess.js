import mongoose from 'mongoose';
import MongooseUser from './User.js';
import MongooseVendorProfile from './VendorProfile.js';
import MongooseProduct from './Product.js';
import MongooseCategory from './Category.js';
import MongooseOrder from './Order.js';
import MongooseCart from './Cart.js';
import MongooseWishlist from './Wishlist.js';
import MongooseCheckoutSession from './CheckoutSession.js';
import MongooseReview from './Review.js';
import MongooseNotification from './Notification.js';
import MongooseContactMessage from './ContactMessage.js';
import { MemoryUser, MemoryVendorProfile, MemoryProduct, MemoryCategory, MemoryOrder, MemoryCart, MemoryWishlist, MemoryCheckoutSession, MemoryReview, MemoryNotification, MemoryContactMessage } from '../config/memoryStore.js';

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

export const getOrderModel = () =>
  isMongoConnected() ? MongooseOrder : MemoryOrder;

export const getCartModel = () =>
  isMongoConnected() ? MongooseCart : MemoryCart;

export const getWishlistModel = () =>
  isMongoConnected() ? MongooseWishlist : MemoryWishlist;

export const getCheckoutSessionModel = () =>
  isMongoConnected() ? MongooseCheckoutSession : MemoryCheckoutSession;

export const getReviewModel = () =>
  isMongoConnected() ? MongooseReview : MemoryReview;

export const getNotificationModel = () =>
  isMongoConnected() ? MongooseNotification : MemoryNotification;

export const getContactMessageModel = () =>
  isMongoConnected() ? MongooseContactMessage : MemoryContactMessage;
