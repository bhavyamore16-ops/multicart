import { getVendorProfileModel } from '../models/dataAccess.js';

// @desc    Get Current Vendor Profile
// @route   GET /api/vendor/profile
// @access  Private (Vendor Only)
export const getMyVendorProfile = async (req, res, next) => {
  try {
    const VendorProfileModel = getVendorProfileModel();
    const profile = await VendorProfileModel.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'No vendor profile found for this account.'
      });
    }

    res.status(200).json({
      success: true,
      vendorProfile: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Vendor Store Profile
// @route   PUT /api/vendor/profile
// @access  Private (Vendor Only)
export const updateVendorProfile = async (req, res, next) => {
  try {
    const VendorProfileModel = getVendorProfileModel();

    const profile = await VendorProfileModel.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.'
      });
    }

    const allowed = ['storeName', 'businessEmail', 'businessPhone', 'businessAddress', 'storeDescription', 'storeLogo', 'storeBanner'];
    const updates = Object.fromEntries(allowed.filter(key => req.body?.[key] !== undefined).map(key => [key, req.body[key]]));
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Provide at least one store profile field to update.' });
    if (updates.storeName !== undefined) {
      if (typeof updates.storeName !== 'string' || updates.storeName.trim().length < 2 || updates.storeName.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Store name must be between 2 and 100 characters.' });
      }
      updates.storeName = updates.storeName.trim();
      const duplicate = await VendorProfileModel.findOne({ storeName: updates.storeName });
      if (duplicate && duplicate._id.toString() !== profile._id.toString()) return res.status(409).json({ success: false, message: 'That store name is already in use.' });
      const slugBase = updates.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const suffix = profile._id.toString().replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase();
      updates.storeSlug = `${slugBase || 'store'}-${suffix}`;
    }
    if (updates.businessEmail !== undefined) {
      updates.businessEmail = String(updates.businessEmail).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.businessEmail) || updates.businessEmail.length > 254) return res.status(400).json({ success: false, message: 'Enter a valid business email.' });
    }
    for (const [field, min, max] of [['businessPhone', 7, 30], ['businessAddress', 5, 300], ['storeDescription', 0, 1000]]) {
      if (updates[field] !== undefined) {
        if (typeof updates[field] !== 'string' || updates[field].trim().length < min || updates[field].trim().length > max) {
          return res.status(400).json({ success: false, message: `${field} must be between ${min} and ${max} characters.` });
        }
        updates[field] = updates[field].trim();
      }
    }
    for (const field of ['storeLogo', 'storeBanner']) {
      if (updates[field] !== undefined && (typeof updates[field] !== 'string' || updates[field].length > 2048)) {
        return res.status(400).json({ success: false, message: `${field} must be a text reference up to 2048 characters.` });
      }
    }

    const updated = await VendorProfileModel.findByIdAndUpdate(
      profile._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Vendor store profile updated successfully!',
      vendorProfile: updated
    });
  } catch (error) {
    next(error);
  }
};
