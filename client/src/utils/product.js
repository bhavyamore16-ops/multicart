export const normalizeProduct = (product = {}) => {
  const basePrice = Number(product.price || 0);
  const discountPercent = Number(product.discountPercent || 0);
  const discountedPrice = Number.isFinite(Number(product.discountedPrice))
    ? Number(product.discountedPrice)
    : Math.round(basePrice * (1 - discountPercent / 100));
  const vendorProfile = product.vendorProfile || {};
  const vendor = product.vendor || {};
  const category = product.category || {};

  return {
    ...product,
    id: String(product._id || product.id || ''),
    slug: product.slug || String(product._id || product.id || ''),
    image: product.thumbnail || product.images?.[0] || '',
    gallery: product.images?.length ? product.images : [product.thumbnail].filter(Boolean),
    categoryName: category.name || product.categoryName || 'Uncategorized',
    categorySlug: category.slug || '',
    vendorId: vendor._id || product.vendorId || product.vendor || '',
    vendorName: vendorProfile.storeName || vendor.name || product.vendorName || 'MultiCart Seller',
    vendorStoreSlug: vendorProfile.storeSlug || '',
    vendorVerified: Boolean(vendorProfile.isVerified),
    rating: Number(product.rating?.average ?? product.rating ?? 0),
    reviewCount: Number(product.rating?.count ?? product.reviewCount ?? 0),
    price: discountedPrice,
    originalPrice: discountPercent > 0 ? basePrice : null,
    discountPercent,
    stock: Number(product.stock || 0),
    isAvailable: product.isAvailable !== false && Number(product.stock) > 0,
    isPurchasable: product.availableToPurchase !== false && product.isAvailable !== false && Number(product.stock) > 0
  };
};
