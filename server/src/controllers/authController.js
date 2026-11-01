import bcrypt from 'bcryptjs';
import { getUserModel, getVendorProfileModel } from '../models/dataAccess.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register a new customer
// @route   POST /api/auth/register-customer
// @access  Public
export const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email address, and password.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters in length.'
      });
    }

    const UserModel = getUserModel();
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    const user = await UserModel.create({
      name,
      email,
      password,
      role: 'customer',
      phone: phone || ''
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Customer account registered successfully!',
      token,
      user: user.toJSON ? user.toJSON() : user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new vendor (seller application)
// @route   POST /api/auth/register-vendor
// @access  Public
export const registerVendor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      storeName,
      businessEmail,
      businessPhone,
      businessAddress,
      storeDescription
    } = req.body;

    if (!name || !email || !password || !storeName || !businessAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields including personal details and store information.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters in length.'
      });
    }

    const UserModel = getUserModel();
    const VendorProfileModel = getVendorProfileModel();

    // Check existing email
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Check existing store name
    const existingStore = await VendorProfileModel.findOne({ storeName });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'A store with this name is already registered. Please choose another name.'
      });
    }

    // Create user
    const user = await UserModel.create({
      name,
      email,
      password,
      role: 'vendor',
      phone: phone || businessPhone || ''
    });

    // Create vendor profile (Pending review)
    const vendorProfile = await VendorProfileModel.create({
      userId: user._id,
      storeName,
      businessEmail: businessEmail || email,
      businessPhone: businessPhone || phone || '',
      businessAddress,
      storeDescription: storeDescription || 'Independent retail store on MultiCart.',
      status: 'pending',
      isVerified: false
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Vendor application registered successfully! Your account is pending administrator review.',
      token,
      user: user.toJSON ? user.toJSON() : user,
      vendorProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate User (Customer, Vendor, Admin)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.'
      });
    }

    const UserModel = getUserModel();
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with this email.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      const VendorProfileModel = getVendorProfileModel();
      vendorProfile = await VendorProfileModel.findOne({ userId: user._id });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: `Signed in successfully as ${user.role.toUpperCase()}`,
      token,
      user: user.toJSON ? user.toJSON() : user,
      vendorProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let vendorProfile = null;

    if (user.role === 'vendor') {
      const VendorProfileModel = getVendorProfileModel();
      vendorProfile = await VendorProfileModel.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: user.toJSON ? user.toJSON() : user,
      vendorProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile (name, phone, address)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const UserModel = getUserModel();

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser.toJSON ? updatedUser.toJSON() : updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change User Password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and new password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters in length.'
      });
    }

    const UserModel = getUserModel();
    const user = await UserModel.findById(req.user._id);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Your current password is incorrect.'
      });
    }

    // Update password
    if (user.save) {
      user.password = newPassword;
      await user.save();
    } else {
      await UserModel.findByIdAndUpdate(user._id, { password: newPassword });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! Please use your new password next time you log in.'
    });
  } catch (error) {
    next(error);
  }
};
