import app from './src/app.js';
import { MemoryCategory, MemoryProduct, MemoryUser, MemoryVendorProfile } from './src/config/memoryStore.js';
import { generateToken } from './src/utils/generateToken.js';

const server = app.listen(0);
await new Promise(resolve => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
let passed = 0;
let failed = 0;

const assert = (condition, label) => {
  if (condition) { passed += 1; console.log(`  ✓ PASS: ${label}`); }
  else { failed += 1; console.error(`  ✗ FAIL: ${label}`); }
};

const identity = async (name, role, status = 'approved') => {
  const user = await MemoryUser.create({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}.${Math.random()}@shopping.test`,
    password: 'TestPassword@123',
    role
  });
  if (role === 'vendor') {
    await MemoryVendorProfile.create({
      userId: user._id,
      storeName: `${name} Shop`,
      status,
      isVerified: status === 'approved'
    });
  }
  return { user, token: generateToken(user._id, role) };
};

const request = (path, { token, method = 'GET', body } = {}) => fetch(`${baseUrl}${path}`, {
  method,
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
  },
  body: body === undefined ? undefined : JSON.stringify(body)
});

const read = async response => ({ status: response.status, body: await response.json() });

try {
  const category = await MemoryCategory.create({ name: `Customer Shopping ${Date.now()}` });
  const vendor = await identity('Approved Shopping Vendor', 'vendor');
  const pendingVendor = await identity('Pending Shopping Vendor', 'vendor', 'pending');
  const customer = await identity('Customer One', 'customer');
  const otherCustomer = await identity('Customer Two', 'customer');

  const product = (name, overrides = {}) => MemoryProduct.create({
    name,
    description: `${name} product detail`,
    price: 100,
    discountPercent: 10,
    stock: 10,
    category: category._id,
    vendor: vendor.user._id,
    vendorProfile: (vendor.profile?._id),
    thumbnail: `https://example.com/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    images: [`https://example.com/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`],
    rating: { average: 4.5, count: 12 },
    ...overrides
  });

  const vendorProfile = await MemoryVendorProfile.findOne({ userId: vendor.user._id });
  const pendingProfile = await MemoryVendorProfile.findOne({ userId: pendingVendor.user._id });
  const mug = await product('Alpine Mug', { vendorProfile: vendorProfile._id, slug: 'alpine-mug' });
  const lamp = await product('Cedar Lamp', { price: 250, stock: 1, discountPercent: 0, rating: { average: 3.8, count: 2 }, vendorProfile: vendorProfile._id, slug: 'cedar-lamp' });
  const soldOut = await product('Sold Out Mug', { stock: 0, vendorProfile: vendorProfile._id, slug: 'sold-out-mug' });
  const inactive = await product('Hidden Item', { isAvailable: false, vendorProfile: vendorProfile._id, slug: 'hidden-item' });
  const pendingItem = await product('Pending Vendor Item', { vendor: pendingVendor.user._id, vendorProfile: pendingProfile._id, slug: 'pending-item' });

  console.log('--- CUSTOMER SHOPPING SUITE ---');
  let result = await read(await request('/products'));
  const listedIds = result.body.products.map(item => item._id);
  assert(result.status === 200 && result.body.total === 3 && listedIds.includes(mug._id) && listedIds.includes(lamp._id) && listedIds.includes(soldOut._id), 'Catalog lists approved-vendor products, including sold-out items with stock status');
  assert(!listedIds.includes(inactive._id) && !listedIds.includes(pendingItem._id), 'Catalog hides delisted products and products from non-approved vendors');

  result = await read(await request('/products?search=alpine'));
  assert(result.status === 200 && result.body.total === 1 && result.body.products[0]._id === mug._id, 'Name search is case-insensitive and functional');
  result = await read(await request('/products?search=detail'));
  assert(result.body.total === 0, 'Name search does not silently match descriptions');
  result = await read(await request(`/products?category=${category.slug}&minPrice=200&maxPrice=300`));
  assert(result.status === 200 && result.body.total === 1 && result.body.products[0]._id === lamp._id, 'Category and minimum/maximum price filters combine correctly');
  result = await read(await request('/products?sort=price_asc'));
  assert(result.body.products[0].price <= result.body.products[1].price && result.body.products[1].price <= result.body.products[2].price, 'Price ascending sort works');
  result = await read(await request('/products?sort=price_desc'));
  assert(result.body.products[0].price >= result.body.products[1].price && result.body.products[1].price >= result.body.products[2].price, 'Price descending sort works');
  result = await read(await request('/products?minPrice=400&maxPrice=200'));
  assert(result.status === 400, 'Invalid price ranges are rejected');

  result = await read(await request(`/products/${mug.slug}`));
  assert(result.status === 200 && result.body.product.vendorProfile?.storeName === 'Approved Shopping Vendor Shop' && result.body.product.category?.name === category.name, 'Product details include category and approved vendor information');
  assert(result.body.product.rating?.average === 4.5 && result.body.product.stock === 10, 'Product details expose persisted ratings and stock');
  result = await read(await request(`/products/${pendingItem.slug}`));
  assert(result.status === 404, 'Direct product details hide listings from pending vendors');

  result = await read(await request('/cart'));
  assert(result.status === 401, 'Cart endpoints require authentication');
  result = await read(await request('/cart', { token: vendor.token }));
  assert(result.status === 403, 'Only customer accounts can use saved cart endpoints');
  result = await read(await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: mug._id, quantity: 2 } }));
  assert(result.status === 200 && result.body.totalItems === 2 && result.body.subtotal === 180 && result.body.total === 330, 'Customer can add a product and receives current discounted subtotal and total');
  result = await read(await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: mug._id, quantity: 9 } }));
  assert(result.status === 409, 'Adding a quantity beyond stock is rejected');
  result = await read(await request('/cart', { token: customer.token }));
  assert(result.body.items[0]?.quantity === 2, 'Rejected stock change leaves the saved cart unchanged');
  result = await read(await request(`/cart/items/${mug._id}`, { token: customer.token, method: 'PATCH', body: { quantity: 3 } }));
  assert(result.status === 200 && result.body.items[0]?.quantity === 3 && result.body.subtotal === 270 && result.body.total === 420, 'Cart quantity increase recalculates totals');
  result = await read(await request(`/cart/items/${mug._id}`, { token: customer.token, method: 'PATCH', body: { quantity: 11 } }));
  assert(result.status === 409, 'Cart quantity update cannot exceed stock');
  result = await read(await request(`/cart/items/${mug._id}`, { token: customer.token, method: 'PATCH', body: { quantity: 1 } }));
  assert(result.status === 200 && result.body.totalItems === 1 && result.body.subtotal === 90 && result.body.total === 240, 'Cart quantity decrease recalculates subtotal and total');
  result = await read(await request('/cart/validate', { token: customer.token, method: 'POST', body: {} }));
  assert(result.status === 200 && result.body.success, 'Customer cart availability validation passes for available stock');

  result = await read(await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: soldOut._id, quantity: 1 } }));
  assert(result.status === 409, 'Out-of-stock products cannot be added to cart');
  result = await read(await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: inactive._id, quantity: 1 } }));
  assert(result.status === 409, 'Products marked unavailable cannot be added to cart');
  await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: lamp._id, quantity: 1 } });
  await MemoryProduct.findById(lamp._id).then(item => { item.stock = 0; });
  result = await read(await request('/cart/validate', { token: customer.token, method: 'POST', body: {} }));
  assert(result.status === 409 && result.body.unavailableItems.some(item => item.productId === lamp._id), 'Cart validation blocks checkout when stock changes after adding');
  result = await read(await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: lamp._id, quantity: 1 } }));
  assert(result.status === 409, 'Cart rejects stock that became unavailable after browsing');

  result = await read(await request('/cart/merge', { token: customer.token, method: 'POST', body: { items: [{ productId: mug._id, quantity: 2 }] } }));
  assert(result.status === 200 && result.body.items[0]?.quantity === 3, 'Guest cart merge preserves existing saved quantities');
  result = await read(await request(`/cart/items/${mug._id}`, { token: customer.token, method: 'DELETE' }));
  assert(result.status === 200 && !result.body.items.some(item => item.productId === mug._id), 'Customer can remove a cart item');
  await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: mug._id, quantity: 1 } });
  result = await read(await request('/cart', { token: otherCustomer.token }));
  assert(result.status === 200 && result.body.items.length === 0, 'Saved carts are isolated per customer account');
  result = await read(await request('/cart', { token: customer.token, method: 'DELETE' }));
  assert(result.status === 200 && result.body.items.length === 0, 'Customer can clear the saved cart');

  result = await read(await request('/wishlist'));
  assert(result.status === 401, 'Wishlist endpoints require authentication');
  result = await read(await request('/wishlist/items', { token: customer.token, method: 'POST', body: { productId: mug._id } }));
  assert(result.status === 200 && result.body.products.length === 1, 'Customer can add an approved vendor product to wishlist');
  await request('/wishlist/items', { token: customer.token, method: 'POST', body: { productId: mug._id } });
  result = await read(await request('/wishlist', { token: customer.token }));
  assert(result.status === 200 && result.body.products.length === 1, 'Wishlist additions are idempotent and persist for the customer');
  result = await read(await request('/wishlist/items', { token: customer.token, method: 'POST', body: { productId: soldOut._id } }));
  assert(result.status === 200 && result.body.products.some(item => item._id === soldOut._id), 'Wishlist can retain an approved product that is out of stock');
  result = await read(await request(`/wishlist/items/${mug._id}`, { token: customer.token, method: 'DELETE' }));
  assert(result.status === 200 && !result.body.products.some(item => item._id === mug._id), 'Customer can remove a wishlist product');
  result = await read(await request('/wishlist', { token: otherCustomer.token }));
  assert(result.status === 200 && result.body.products.length === 0, 'Wishlists are isolated per customer account');

  console.log(`--- RESULT: ${passed} passed, ${failed} failed ---`);
} catch (error) {
  failed += 1;
  console.error('  ✗ FAIL: suite crashed:', error);
} finally {
  await new Promise(resolve => server.close(resolve));
}

if (failed) process.exitCode = 1;
