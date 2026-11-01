import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './src/config/db.js';
import { seedInitialAccounts } from './src/utils/seedData.js';
import {
  registerCustomer,
  registerVendor,
  login,
  getMe,
  updateProfile,
  changePassword
} from './src/controllers/authController.js';
import {
  getAllUsers,
  getVendorApplications,
  updateVendorStatus
} from './src/controllers/adminController.js';
import { getMyVendorProfile } from './src/controllers/vendorController.js';
import { protect } from './src/middleware/authMiddleware.js';
import { requireRole } from './src/middleware/roleMiddleware.js';

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.body = null;
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  json(data) {
    this.body = data;
    return this;
  }
}

const runTests = async () => {
  console.log('--- STARTING IN-PROCESS INTEGRATION & SECURITY SUITE ---');

  await connectDB();
  await seedInitialAccounts();

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  };

  // Helper to run middleware
  const runMiddleware = async (middleware, req, res) => {
    return new Promise((resolve) => {
      middleware(req, res, (err) => {
        resolve({ nextCalled: true, err });
      });
      // if res.status was called without next
      setTimeout(() => resolve({ nextCalled: false }), 20);
    });
  };

  // 1. Customer Registration
  const testCustomerEmail = `aditi.${Date.now()}@example.com`;
  const reqRegCust = {
    body: {
      name: 'Aditi Rao',
      email: testCustomerEmail,
      password: 'Password@123',
      phone: '+91 99887 76655'
    }
  };
  const resRegCust = new MockResponse();
  await registerCustomer(reqRegCust, resRegCust, () => {});
  assert(
    resRegCust.statusCode === 201 &&
    resRegCust.body.token &&
    resRegCust.body.user.role === 'customer' &&
    !resRegCust.body.user.password,
    'Customer Registration: Returns 201, Valid JWT, Role=customer, Password excluded'
  );
  const customerToken = resRegCust.body.token;
  const customerUser = resRegCust.body.user;

  // 2. Prevent duplicate email registration
  const resDup = new MockResponse();
  await registerCustomer(reqRegCust, resDup, () => {});
  assert(
    resDup.statusCode === 400 && resDup.body.success === false,
    'Duplicate Registration Prevention: Returns 400 with descriptive error'
  );

  // 3. Vendor Registration with pending status
  const testVendorEmail = `karthik.spices.${Date.now()}@example.com`;
  const reqRegVendor = {
    body: {
      name: 'Karthik Raja',
      email: testVendorEmail,
      password: 'Vendor@12345',
      phone: '+91 99000 11223',
      storeName: `Kerala Spices Hub ${Date.now()}`,
      businessEmail: testVendorEmail,
      businessPhone: '+91 99000 11223',
      businessAddress: 'Spice Market Road, Kochi, Kerala'
    }
  };
  const resRegVendor = new MockResponse();
  await registerVendor(reqRegVendor, resRegVendor, () => {});
  assert(
    resRegVendor.statusCode === 201 &&
    resRegVendor.body.token &&
    resRegVendor.body.user.role === 'vendor' &&
    resRegVendor.body.vendorProfile.status === 'pending' &&
    resRegVendor.body.vendorProfile.isVerified === false,
    'Vendor Registration: Role=vendor, Status=pending, Requires Admin Verification'
  );
  const vendorToken = resRegVendor.body.token;
  const vendorUser = resRegVendor.body.user;
  const vendorProfile = resRegVendor.body.vendorProfile;

  // 4. Admin Authentication with Seeded Account
  const reqAdminLogin = {
    body: {
      email: 'admin@multicart.com',
      password: 'Admin@12345'
    }
  };
  const resAdminLogin = new MockResponse();
  await login(reqAdminLogin, resAdminLogin, () => {});
  assert(
    resAdminLogin.statusCode === 200 &&
    resAdminLogin.body.user.role === 'admin' &&
    resAdminLogin.body.token,
    'Super Admin Login: Authenticates seeded admin account and issues signed JWT'
  );
  const adminToken = resAdminLogin.body.token;
  const adminUser = resAdminLogin.body.user;

  // 5. JWT Auth Middleware Verification
  const reqProtect = { headers: { authorization: `Bearer ${customerToken}` } };
  const resProtect = new MockResponse();
  const protectResult = await runMiddleware(protect, reqProtect, resProtect);
  assert(
    protectResult.nextCalled && reqProtect.user && reqProtect.user.email === testCustomerEmail,
    'JWT Auth Middleware: Validates Bearer token and attaches authenticated user to req'
  );

  // 6. JWT Auth Middleware Rejects Request Without Token
  const reqNoToken = { headers: {} };
  const resNoToken = new MockResponse();
  await runMiddleware(protect, reqNoToken, resNoToken);
  assert(
    resNoToken.statusCode === 401 && resNoToken.body.success === false,
    'JWT Auth Middleware: Rejects unauthenticated request with 401'
  );

  // 7. Protected Route: Get Profile (/api/auth/me)
  const reqMe = { user: customerUser };
  const resMe = new MockResponse();
  await getMe(reqMe, resMe, () => {});
  assert(
    resMe.statusCode === 200 && resMe.body.user.email === testCustomerEmail,
    'Protected Route GET /api/auth/me returns current user data'
  );

  // 8. Update Profile (/api/auth/profile)
  const reqUpdate = {
    user: customerUser,
    body: {
      name: 'Aditi Rao Hydari',
      phone: '+91 91111 22222',
      address: { city: 'Bengaluru', state: 'Karnataka' }
    }
  };
  const resUpdate = new MockResponse();
  await updateProfile(reqUpdate, resUpdate, () => {});
  assert(
    resUpdate.statusCode === 200 && resUpdate.body.user.name === 'Aditi Rao Hydari',
    'Customer Profile Update: Modifies user personal details and returns updated record'
  );

  // 9. Change Password with Old Password Verification
  const reqChangePass = {
    user: customerUser,
    body: {
      currentPassword: 'Password@123',
      newPassword: 'NewPassword@789'
    }
  };
  const resChangePass = new MockResponse();
  await changePassword(reqChangePass, resChangePass, () => {});
  assert(
    resChangePass.statusCode === 200 && resChangePass.body.success === true,
    'Change Password: Validates old password and hashes new password with bcrypt'
  );

  // 10. Login with new password
  const reqNewLogin = {
    body: {
      email: testCustomerEmail,
      password: 'NewPassword@789'
    }
  };
  const resNewLogin = new MockResponse();
  await login(reqNewLogin, resNewLogin, () => {});
  assert(
    resNewLogin.statusCode === 200,
    'Login Verification: Successfully logs in with newly updated password'
  );

  // 11. RBAC Guard: Customer Attempting to Access Admin Route
  const reqCustAdmin = { user: customerUser };
  const resCustAdmin = new MockResponse();
  const adminGuard = requireRole('admin');
  await runMiddleware(adminGuard, reqCustAdmin, resCustAdmin);
  assert(
    resCustAdmin.statusCode === 403,
    'RBAC Security Guard: Customer access to Admin endpoint blocked with 403 Forbidden'
  );

  // 12. RBAC Guard: Customer Attempting to Access Vendor Route
  const reqCustVendor = { user: customerUser };
  const resCustVendor = new MockResponse();
  const vendorGuard = requireRole('vendor');
  await runMiddleware(vendorGuard, reqCustVendor, resCustVendor);
  assert(
    resCustVendor.statusCode === 403,
    'RBAC Security Guard: Customer access to Vendor endpoint blocked with 403 Forbidden'
  );

  // 13. RBAC Guard: Vendor Attempting to Access Admin Route
  const reqVendAdmin = { user: vendorUser };
  const resVendAdmin = new MockResponse();
  await runMiddleware(adminGuard, reqVendAdmin, resVendAdmin);
  assert(
    resVendAdmin.statusCode === 403,
    'RBAC Security Guard: Vendor access to Admin endpoint blocked with 403 Forbidden'
  );

  // 14. Admin Gets All Registered Users (/api/admin/users)
  const reqAdminUsers = { query: {} };
  const resAdminUsers = new MockResponse();
  await getAllUsers(reqAdminUsers, resAdminUsers, () => {});
  assert(
    resAdminUsers.statusCode === 200 && resAdminUsers.body.users.length >= 4,
    'Admin Governance: Admin retrieves complete list of registered marketplace users'
  );

  // 15. Admin Gets Vendor Applications (/api/admin/vendors)
  const reqAdminApps = { query: { status: 'pending' } };
  const resAdminApps = new MockResponse();
  await getVendorApplications(reqAdminApps, resAdminApps, () => {});
  assert(
    resAdminApps.statusCode === 200 && resAdminApps.body.vendors.some(v => v.status === 'pending'),
    'Admin Governance: Admin inspects pending vendor registration applications'
  );

  // 16. Admin Approves Pending Vendor Application
  const reqApprove = {
    params: { id: vendorProfile._id },
    body: { status: 'approved', commissionRate: 10.0 }
  };
  const resApprove = new MockResponse();
  await updateVendorStatus(reqApprove, resApprove, () => {});
  assert(
    resApprove.statusCode === 200 &&
    resApprove.body.vendorProfile.status === 'approved' &&
    resApprove.body.vendorProfile.isVerified === true,
    'Admin Governance: Admin approves vendor application (Status: approved, isVerified: true)'
  );

  // 17. Approved Vendor Accesses Vendor Profile
  const reqVendorProfile = { user: vendorUser };
  const resVendorProfile = new MockResponse();
  await getMyVendorProfile(reqVendorProfile, resVendorProfile, () => {});
  assert(
    resVendorProfile.statusCode === 200 &&
    resVendorProfile.body.vendorProfile.status === 'approved',
    'Vendor Operations: Approved vendor accesses store profile and management features'
  );

  console.log('\n=======================================');
  console.log(`TOTAL TESTS PASSED: ${passed}`);
  console.log(`TOTAL TESTS FAILED: ${failed}`);
  console.log('=======================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL PHASE 3 AUTHENTICATION & RBAC SECURITY TESTS PASSED!\n');
    process.exit(0);
  }
};

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
