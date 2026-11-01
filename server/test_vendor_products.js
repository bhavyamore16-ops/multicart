import app from './src/app.js';
import { MemoryCategory, MemoryOrder, MemoryUser, MemoryVendorProfile } from './src/config/memoryStore.js';
import { generateToken } from './src/utils/generateToken.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = app.listen(0);
await new Promise(resolve => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

let passed = 0;
let failed = 0;
let uploadedFilename = '';

const assert = (condition, label) => {
  if (condition) {
    passed += 1;
    console.log(`  ✓ PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ FAIL: ${label}`);
  }
};

const createIdentity = async (name, role, status = 'approved') => {
  const user = await MemoryUser.create({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}.${Math.random()}@test.example`,
    password: 'TestPassword@123',
    role
  });
  if (role === 'vendor') {
    await MemoryVendorProfile.create({
      userId: user._id,
      storeName: `${name} Store ${Date.now()} ${Math.random()}`,
      businessEmail: user.email,
      businessPhone: '9999999999',
      businessAddress: 'Test address',
      status
    });
  }
  return { user, token: generateToken(user._id, role) };
};

const request = (pathName, { token, method = 'GET', body, headers = {} } = {}) => fetch(`${baseUrl}${pathName}`, {
  method,
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  },
  body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body))
});

const sampleProduct = (categoryId, overrides = {}) => ({
  name: 'Test Ceramic Mug',
  description: 'A ceramic mug used for vendor product API verification.',
  shortDescription: 'Handmade ceramic mug',
  price: 1299,
  discountPercent: 10,
  stock: 12,
  category: categoryId,
  images: ['https://example.com/mug.jpg'],
  thumbnail: 'https://example.com/mug.jpg',
  isAvailable: true,
  tags: ['ceramic', 'mug'],
  ...overrides
});

try {
  const category = await MemoryCategory.create({ name: `Test Products ${Date.now()}` });
  const owner = await createIdentity('Owner Vendor', 'vendor');
  const otherVendor = await createIdentity('Other Vendor', 'vendor');
  const pendingVendor = await createIdentity('Pending Vendor', 'vendor', 'pending');
  const customer = await createIdentity('Customer Shopper', 'customer');

  console.log('--- VENDOR PRODUCT CRUD AND PERMISSION SUITE ---');

  let response = await request('/vendor/products');
  assert(response.status === 401, 'Vendor product APIs reject unauthenticated requests');

  response = await request('/vendor/products', {
    token: pendingVendor.token,
    method: 'POST',
    body: sampleProduct(category._id)
  });
  assert(response.status === 403, 'Pending vendors cannot create products');

  response = await request('/vendor/products', {
    token: customer.token,
    method: 'POST',
    body: sampleProduct(category._id)
  });
  assert(response.status === 403, 'Customers cannot create vendor products');

  response = await request('/vendor/products', {
    token: owner.token,
    method: 'POST',
    body: sampleProduct(category._id, { stock: 1.5 })
  });
  assert(response.status === 400, 'Product validation rejects fractional stock');

  response = await request('/vendor/products', {
    token: owner.token,
    method: 'POST',
    body: sampleProduct(category._id, { price: -1 })
  });
  assert(response.status === 400, 'Product validation rejects negative prices');

  response = await request('/vendor/products', {
    token: owner.token,
    method: 'POST',
    body: sampleProduct('missing-category')
  });
  assert(response.status === 400, 'Product validation rejects unknown categories');

  response = await request('/vendor/products', {
    token: owner.token,
    method: 'POST',
    body: sampleProduct(category._id, { isAvailable: 'false' })
  });
  const created = await response.json();
  assert(response.status === 201 && created.product?.vendor === owner.user._id, 'Approved vendor can create a product owned by their account');
  const productId = created.product?._id;

  response = await request('/vendor/products', { token: owner.token });
  const ownerProducts = await response.json();
  assert(response.status === 200 && ownerProducts.products.some(product => product._id === productId), 'Vendor can list their own product records');
  assert(ownerProducts.products.find(product => product._id === productId)?.isAvailable === false, 'String availability values are parsed correctly');

  response = await request('/vendor/products', {
    token: otherVendor.token,
    method: 'POST',
    body: sampleProduct(category._id, { name: 'Other Vendor Mug' })
  });
  const otherProduct = await response.json();
  assert(response.status === 201, 'Second approved vendor can create their own product');
  const otherProductId = otherProduct.product?._id;

  response = await request('/vendor/products', { token: owner.token });
  const isolatedProducts = await response.json();
  assert(!isolatedProducts.products.some(product => product._id === otherProductId), 'Vendor product listings exclude products owned by other vendors');

  response = await request(`/vendor/products/${otherProductId}`, {
    token: owner.token,
    method: 'PUT',
    body: { price: 50 }
  });
  assert(response.status === 403, 'Vendor cannot edit another vendor product');

  response = await request(`/vendor/products/${otherProductId}`, {
    token: owner.token,
    method: 'DELETE'
  });
  assert(response.status === 403, 'Vendor cannot delete another vendor product');

  response = await request(`/vendor/products/${productId}`, {
    token: owner.token,
    method: 'PUT',
    body: { name: 'Updated Ceramic Mug', price: 1599, stock: 8, isAvailable: true }
  });
  const updated = await response.json();
  assert(response.status === 200 && updated.product?.name === 'Updated Ceramic Mug' && updated.product?.stock === 8, 'Vendor can update their product fields');

  response = await request(`/vendor/products/${productId}`, {
    token: owner.token,
    method: 'PUT',
    body: { stock: 2.25 }
  });
  assert(response.status === 400, 'Product update validation rejects fractional stock');

  response = await request('/vendor/stats', { token: owner.token });
  const stats = await response.json();
  assert(response.status === 200 && stats.stats?.totalProducts === 1, 'Vendor dashboard stats count only the current vendor products');

  await MemoryOrder.create({
    orderNumber: `MC-TEST-${Date.now()}`,
    customer: customer.user._id,
    items: [{
      product: productId,
      vendor: owner.user._id,
      name: 'Updated Ceramic Mug',
      price: 1299,
      quantity: 2,
      subtotal: 2598
    }],
    subtotal: 2598,
    total: 2598,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date()
  });

  response = await request('/vendor/stats', { token: owner.token });
  const statsWithOrder = await response.json();
  assert(response.status === 200 && statsWithOrder.stats?.totalOrders === 1 && statsWithOrder.stats?.recentOrders?.[0]?.itemCount === 2, 'Vendor stats include recent vendor-specific order lines');

  response = await request('/vendor/sales-report', { token: owner.token });
  const report = await response.json();
  assert(response.status === 200 && report.report?.totalRevenue === 2598 && report.report?.totalOrders === 1, 'Sales report uses actual order revenue rather than generated sample figures');

  const imageForm = new FormData();
  imageForm.append('image', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'tiny.png');
  response = await request('/vendor/upload', { token: owner.token, method: 'POST', body: imageForm });
  const uploadResult = await response.json();
  uploadedFilename = uploadResult.filename || '';
  assert(response.status === 200 && uploadResult.imageUrl?.includes('/uploads/'), 'Approved vendor can upload and receive a public product image URL');

  const invalidImageForm = new FormData();
  invalidImageForm.append('image', new Blob(['not an image'], { type: 'text/plain' }), 'readme.txt');
  response = await request('/vendor/upload', { token: owner.token, method: 'POST', body: invalidImageForm });
  assert(response.status === 400, 'Image upload rejects unsupported file types');

  response = await request(`/vendor/products/${productId}`, {
    token: owner.token,
    method: 'DELETE'
  });
  assert(response.status === 200, 'Vendor can delete their own product');

  response = await request(`/vendor/products/${productId}`, {
    token: owner.token,
    method: 'DELETE'
  });
  assert(response.status === 404, 'Deleted product cannot be deleted a second time');
} catch (error) {
  failed += 1;
  console.error('  ✗ FAIL: Unexpected test error:', error);
} finally {
  if (uploadedFilename) {
    await fs.unlink(path.join(__dirname, 'uploads', path.basename(uploadedFilename))).catch(() => {});
  }
  await new Promise(resolve => server.close(resolve));
}

console.log(`--- RESULT: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exitCode = 1;
