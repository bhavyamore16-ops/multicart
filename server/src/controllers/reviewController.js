import mongoose from 'mongoose';
import { getOrderModel, getProductModel, getReviewModel, getUserModel } from '../models/dataAccess.js';
import { idOf } from '../utils/productPresentation.js';

const plain = item => item?.toJSON ? item.toJSON() : item?.toObject ? item.toObject() : item;
const isMongoConnected = () => mongoose.connection?.readyState === 1;
const validId = value => Boolean(value && (!isMongoConnected() || mongoose.Types.ObjectId.isValid(value)));

export const getProductReviews = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const product = await getProductModel().findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const ReviewModel = getReviewModel();
    const UserModel = getUserModel();
    const stored = await ReviewModel.find({ product: product._id });
    const reviews = await Promise.all((stored || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100).map(async row => {
      const review = plain(row);
      const customer = review.customer && typeof review.customer === 'object' && review.customer.name
        ? review.customer
        : await UserModel.findById(idOf(review.customer));
      return {
        ...review,
        customer: customer ? { _id: idOf(customer._id), name: customer.name || 'Customer' } : { name: 'Customer' }
      };
    }));
    const all = stored || [];
    const average = all.length ? Math.round(all.reduce((sum, review) => sum + Number(review.rating || 0), 0) / all.length * 10) / 10 : 0;
    res.json({ success: true, reviews, rating: { average, count: all.length } });
  } catch (error) { next(error); }
};

export const getReviewEligibility = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product id.' });
    const product = await getProductModel().findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const [orders, existingReviews] = await Promise.all([
      getOrderModel().find({ customer: req.user._id, status: 'delivered' }),
      getReviewModel().find({ customer: req.user._id, product: product._id })
    ]);
    const reviewedOrders = new Set((existingReviews || []).map(review => idOf(review.order)));
    const eligibleOrders = (orders || [])
      .filter(order => !reviewedOrders.has(idOf(order._id)) && (order.items || []).some(item => idOf(item.product) === idOf(product._id)))
      .map(order => ({ id: idOf(order._id), orderNumber: order.orderNumber, deliveredAt: order.deliveredAt || order.updatedAt }));
    res.json({ success: true, eligibleOrders });
  } catch (error) { next(error); }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { orderId, rating, title, comment } = req.body || {};
    if (!validId(req.params.id) || !validId(orderId)) return res.status(400).json({ success: false, message: 'Select a valid delivered order for this review.' });
    const stars = Number(rating);
    const reviewTitle = String(title || '').trim();
    const reviewComment = String(comment || '').trim();
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5.' });
    if (reviewTitle.length > 120) return res.status(400).json({ success: false, message: 'Review title cannot exceed 120 characters.' });
    if (reviewComment.length < 5 || reviewComment.length > 2000) return res.status(400).json({ success: false, message: 'Review must be between 5 and 2000 characters.' });

    const ProductModel = getProductModel();
    const OrderModel = getOrderModel();
    const ReviewModel = getReviewModel();
    const [product, order] = await Promise.all([
      ProductModel.findById(req.params.id),
      OrderModel.findById(orderId)
    ]);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (!order || idOf(order.customer) !== idOf(req.user._id) || order.status !== 'delivered') {
      return res.status(403).json({ success: false, message: 'A review is available after your purchase has been delivered.' });
    }
    if (!(order.items || []).some(item => idOf(item.product) === idOf(product._id))) {
      return res.status(403).json({ success: false, message: 'This delivered order does not contain the selected product.' });
    }
    if (await ReviewModel.findOne({ product: product._id, customer: req.user._id, order: order._id })) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product for that purchase.' });
    }

    let review;
    try {
      review = await ReviewModel.create({ product: product._id, customer: req.user._id, order: order._id, rating: stars, title: reviewTitle, comment: reviewComment });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ success: false, message: 'You have already reviewed this product for that purchase.' });
      throw error;
    }
    const savedReviews = await ReviewModel.find({ product: product._id });
    const count = savedReviews.length;
    const average = count ? Math.round(savedReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count * 10) / 10 : 0;
    await ProductModel.findByIdAndUpdate(product._id, { rating: { average, count } }, { new: true, runValidators: true });
    const saved = plain(review);
    const customer = await getUserModel().findById(req.user._id);
    res.status(201).json({ success: true, message: 'Your review has been published.', review: { ...saved, customer: { _id: idOf(req.user._id), name: customer?.name || 'Customer' } }, rating: { average, count } });
  } catch (error) { next(error); }
};
