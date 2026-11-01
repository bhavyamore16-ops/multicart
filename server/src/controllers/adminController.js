import { getUserModel, getVendorProfileModel } from '../models/dataAccess.js';

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
      const user = await UserModel.findById(app.userId);
      return {
        ...app,
        user: user ? (user.toJSON ? user.toJSON() : user) : null
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
