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
    const { storeDescription, storeLogo, storeBanner, businessPhone, businessAddress } = req.body;
    const VendorProfileModel = getVendorProfileModel();

    const profile = await VendorProfileModel.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found.'
      });
    }

    const updated = await VendorProfileModel.findByIdAndUpdate(
      profile._id,
      { storeDescription, storeLogo, storeBanner, businessPhone, businessAddress },
      { new: true }
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
