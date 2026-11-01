import {
  getUserModel,
  getVendorProfileModel,
  getProductModel,
  getCategoryModel,
  getOrderModel
} from '../models/dataAccess.js';
import { createUserNotification } from '../utils/notifications.js';

const plain = value => value?.toJSON ? value.toJSON() : (value?.toObject ? value.toObject() : value);
const idOf = value => value?._id?.toString?.() || value?.toString?.() || '';
const isRecognizedSale = order => order.status !== 'cancelled' && order.paymentStatus === 'paid';

const allOrders = async () => {
  const result = await getOrderModel().find({});
  return Array.isArray(result) ? result : [];
};

// @route GET /api/admin/overview
// @access Private (Admin Only)
export const getAdminOverview = async (req, res, next) => {
  try {
    const [customers, vendors, profiles, products, categories, orders] = await Promise.all([
      getUserModel().find({ role: 'customer' }),
      getUserModel().find({ role: 'vendor' }),
      getVendorProfileModel().find({}),
      getProductModel().find({}),
      getCategoryModel().find({}),
      allOrders()
    ]);
    const profileList = Array.isArray(profiles) ? profiles : [];
    const orderList = Array.isArray(orders) ? orders : [];
    const paidRevenue = orderList.reduce((sum, order) => sum + (isRecognizedSale(order) ? Number(order.total || 0) : 0), 0);

    res.json({
      success: true,
      overview: {
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        totalVendors: Array.isArray(vendors) ? vendors.length : 0,
        pendingVendors: profileList.filter(profile => profile.status === 'pending').length,
        approvedVendors: profileList.filter(profile => profile.status === 'approved').length,
        totalProducts: Array.isArray(products) ? products.length : 0,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalOrders: orderList.length,
        totalRevenue: paidRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/admin/reports
// @access Private (Admin Only)
export const getAdminReports = async (req, res, next) => {
  try {
    const [orders, products, profiles] = await Promise.all([
      allOrders(),
      getProductModel().find({}),
      getVendorProfileModel().find({})
    ]);
    const orderList = Array.isArray(orders) ? orders : [];
    const productList = Array.isArray(products) ? products.map(plain) : [];
    const profileList = Array.isArray(profiles) ? profiles.map(plain) : [];
    const completed = orderList.filter(isRecognizedSale);
    const monthlySales = [];
    const now = new Date();
    for (let offset = 11; offset >= 0; offset -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const sales = completed.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt);
        return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}` === key
          ? sum + Number(order.total || 0)
          : sum;
      }, 0);
      monthlySales.push({ month: key, label: month.toLocaleString('en-IN', { month: 'short' }), sales });
    }

    const productSales = new Map();
    const vendorSales = new Map();
    for (const order of completed) {
      const vendorId = idOf(order.vendor);
      vendorSales.set(vendorId, (vendorSales.get(vendorId) || 0) + Number(order.total || 0));
      for (const item of order.items || []) {
        const productId = idOf(item.product);
        if (!productId) continue;
        const current = productSales.get(productId) || { quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.subtotal ?? (Number(item.price || 0) * Number(item.quantity || 0)));
        productSales.set(productId, current);
      }
    }
    const productsById = new Map(productList.map(product => [idOf(product), product]));
    const profilesByUser = new Map(profileList.map(profile => [idOf(profile.userId), profile]));
    const bestSellingProducts = [...productSales.entries()]
      .map(([id, totals]) => ({ product: productsById.get(id), ...totals }))
      .filter(entry => entry.product)
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 8)
      .map(({ product, quantity, revenue }) => ({
        id: idOf(product), name: product.name, quantity, revenue, price: Number(product.price || 0)
      }));
    const topVendors = [...vendorSales.entries()]
      .map(([userId, sales]) => ({ userId, profile: profilesByUser.get(userId), sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8)
      .map(({ userId, profile, sales }) => ({
        id: userId, storeName: profile?.storeName || 'Vendor', sales
      }));

    res.json({
      success: true,
      reports: {
        totalSales: completed.reduce((sum, order) => sum + Number(order.total || 0), 0),
        totalOrders: orderList.length,
        paidSalesOrders: completed.length,
        monthlySales,
        bestSellingProducts,
        topVendors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private (Admin Only)
export const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const UserModel = getUserModel();
    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await UserModel.find(query);
    const sanitized = users.map(u => u.toJSON ? u.toJSON() : u);

    res.status(200).json({
      success: true,
      count: sanitized.length,
      users: sanitized
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor applications
// @route   GET /api/admin/vendors
// @access  Private (Admin Only)
export const getVendorApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const VendorProfileModel = getVendorProfileModel();
    const UserModel = getUserModel();
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const applications = await VendorProfileModel.find(query);

    // Populate user info
    const enriched = await Promise.all(applications.map(async (app) => {
      const profile = plain(app);
      const user = await UserModel.findById(profile.userId);
      return {
        ...profile,
        user: user ? plain(user) : null
      };
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      vendors: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject vendor application
// @route   PUT /api/admin/vendors/:id/status
// @access  Private (Admin Only)
export const updateVendorStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason, commissionRate } = req.body;
    const { id } = req.params;

    if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: 'pending', 'approved', 'rejected', 'suspended'."
      });
    }

    const VendorProfileModel = getVendorProfileModel();
    const profile = await VendorProfileModel.findById(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.'
      });
    }

    const updates = {
      status,
      isVerified: status === 'approved',
      rejectionReason: status === 'rejected' ? (rejectionReason || 'Failed verification') : ''
    };

    if (commissionRate !== undefined) {
      updates.commissionRate = Number(commissionRate);
    }

    const updatedProfile = await VendorProfileModel.findByIdAndUpdate(id, updates, { new: true });

    if (profile.status !== status) {
      const notificationText = status === 'approved'
        ? 'Your vendor application has been approved. Your storefront can now sell on MultiCart.'
        : status === 'rejected'
          ? `Your vendor application was rejected. ${updates.rejectionReason}`
          : status === 'suspended'
            ? 'Your vendor storefront has been suspended by the platform administrator.'
            : 'Your vendor application status has changed.';
      await createUserNotification(profile.userId, {
        type: status === 'approved' ? 'vendor_approved' : 'vendor_status',
        title: status === 'approved' ? 'Vendor application approved' : `Vendor application ${status}`,
        message: notificationText,
        href: '/vendor/dashboard'
      });
    }

    res.status(200).json({
      success: true,
      message: `Vendor status successfully updated to '${status}'.`,
      vendorProfile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin Only)
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const UserModel = getUserModel();
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Protect super admin from self-deactivation
    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.'
      });
    }

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { isActive: !user.isActive },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `User account has been ${updated.isActive ? 'activated' : 'deactivated'}.`,
      user: updated.toJSON ? updated.toJSON() : updated
    });
  } catch (error) {
    next(error);
  }
};
