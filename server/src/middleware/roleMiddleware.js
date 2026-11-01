import { getVendorProfileModel } from '../models/dataAccess.js';

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission verification.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' is not authorized to access this resource. Required: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

export const requireApprovedVendor = async (req, res, next) => {
  if (!req.user || req.user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to vendor accounts.'
    });
  }

  const VendorProfileModel = getVendorProfileModel();
  const profile = await VendorProfileModel.findOne({ userId: req.user._id });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found for this account.'
    });
  }

  if (profile.status === 'pending') {
    return res.status(403).json({
      success: false,
      status: 'pending',
      message: 'Your vendor application is currently pending Administrator review. Product publishing is locked until approved.'
    });
  }

  if (profile.status === 'rejected') {
    return res.status(403).json({
      success: false,
      status: 'rejected',
      message: `Your vendor application was rejected. Reason: ${profile.rejectionReason || 'Business verification failed'}`
    });
  }

  if (profile.status === 'suspended') {
    return res.status(403).json({
      success: false,
      status: 'suspended',
      message: 'Your vendor storefront has been suspended by the platform administrator.'
    });
  }

  req.vendorProfile = profile;
  next();
};
