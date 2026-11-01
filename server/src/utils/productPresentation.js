import { getCategoryModel, getUserModel, getVendorProfileModel } from '../models/dataAccess.js';

const asPlainObject = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject({ virtuals: true });
  if (typeof value.toJSON === 'function') return value.toJSON();
  return value;
};

const idOf = (value) => value?._id?.toString?.() || value?.toString?.() || '';
const looksPopulated = (value, keys) => value && typeof value === 'object' && keys.some(key => value[key] !== undefined);

export const presentProduct = async (product) => {
  const raw = asPlainObject(product) || {};
  const CategoryModel = getCategoryModel();
  const UserModel = getUserModel();
  const VendorProfileModel = getVendorProfileModel();

  let category = looksPopulated(raw.category, ['name', 'slug'])
    ? asPlainObject(raw.category)
    : (raw.category ? await CategoryModel.findById(idOf(raw.category)) : null);
  let vendor = looksPopulated(raw.vendor, ['name', 'avatar'])
    ? asPlainObject(raw.vendor)
    : (raw.vendor ? await UserModel.findById(idOf(raw.vendor)) : null);
  let vendorProfile = looksPopulated(raw.vendorProfile, ['storeName', 'status'])
    ? asPlainObject(raw.vendorProfile)
    : (raw.vendorProfile ? await VendorProfileModel.findById(idOf(raw.vendorProfile)) : null);

  if (!vendorProfile && raw.vendor) {
    vendorProfile = await VendorProfileModel.findOne({ userId: idOf(raw.vendor) });
  }

  category = asPlainObject(category);
  vendor = asPlainObject(vendor);
  vendorProfile = asPlainObject(vendorProfile);
  const price = Number(raw.price || 0);
  const discountPercent = Number(raw.discountPercent || 0);
  const discountedPrice = Number.isFinite(Number(raw.discountedPrice))
    ? Number(raw.discountedPrice)
    : Math.round(price * (1 - discountPercent / 100));

  return {
    ...raw,
    _id: idOf(raw._id),
    category: category ? { _id: idOf(category._id), name: category.name, slug: category.slug, icon: category.icon } : null,
    vendor: vendor ? { _id: idOf(vendor._id), name: vendor.name, avatar: vendor.avatar } : { _id: idOf(raw.vendor), name: '' },
    vendorProfile: vendorProfile ? {
      _id: idOf(vendorProfile._id),
      storeName: vendorProfile.storeName,
      storeSlug: vendorProfile.storeSlug,
      storeLogo: vendorProfile.storeLogo,
      status: vendorProfile.status,
      isVerified: vendorProfile.isVerified
    } : null,
    price,
    discountPercent,
    discountedPrice,
    availableToPurchase: raw.isApproved !== false && raw.isAvailable !== false && Number(raw.stock) > 0 && vendorProfile?.status === 'approved'
  };
};

export const approvedVendorIds = async () => {
  const VendorProfileModel = getVendorProfileModel();
  const profiles = await VendorProfileModel.find({ status: 'approved' });
  return profiles.map(profile => idOf(profile.userId)).filter(Boolean);
};

export const isProductFromApprovedVendor = async (product) => {
  if (!product || product.isApproved === false) return false;
  const raw = asPlainObject(product) || {};
  let profile = looksPopulated(raw.vendorProfile, ['status']) ? raw.vendorProfile : null;
  if (!profile && raw.vendorProfile) profile = await getVendorProfileModel().findById(idOf(raw.vendorProfile));
  if (!profile && raw.vendor) profile = await getVendorProfileModel().findOne({ userId: idOf(raw.vendor) });
  return asPlainObject(profile)?.status === 'approved';
};

export { idOf };
