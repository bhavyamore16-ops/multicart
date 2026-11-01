import bcrypt from 'bcryptjs';
import { getUserModel, getVendorProfileModel, getCategoryModel, getProductModel } from '../models/dataAccess.js';

export const seedInitialAccounts = async () => {
  try {
    const UserModel          = getUserModel();
    const VendorProfileModel = getVendorProfileModel();
    const CategoryModel      = getCategoryModel();
    const ProductModel       = getProductModel();

    // Skip if already seeded
    const adminExists = await UserModel.findOne({ email: 'admin@multicart.com' });
    if (adminExists) return;

    console.log('[Seed] Seeding MultiCart initial data...');

    // ── 1. Admin ──────────────────────────────────────────────────────────────
    await UserModel.create({
      name: 'Super Administrator',
      email: process.env.ADMIN_INITIAL_EMAIL || 'admin@multicart.com',
      password: process.env.ADMIN_INITIAL_PASSWORD || 'Admin@12345',
      role: 'admin',
      phone: '+91 98000 00001',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });

    // ── 2. Vendor 1: Apex Electronics (Approved) ──────────────────────────────
    const vendor1 = await UserModel.create({
      name: 'Vikram Malhotra',
      email: 'apex.seller@example.com',
      password: 'Vendor@12345',
      role: 'vendor',
      phone: '+91 98000 00002',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
    });
    const vendor1Profile = await VendorProfileModel.create({
      userId: vendor1._id,
      storeName: 'Apex Electronics',
      businessEmail: 'support@apexelectronics.com',
      businessPhone: '+91 98000 00002',
      businessAddress: 'Plot 44, Electronic City Phase 1, Bengaluru, Karnataka',
      storeDescription: 'Premier authorized distributor of audio, wearables, and smartphones.',
      status: 'approved', isVerified: true, commissionRate: 10.0,
      totalEarnings: 45000.0, withdrawableBalance: 28000.0
    });

    // ── 3. Vendor 2: Casa Craft Home (Approved) ───────────────────────────────
    const vendor2 = await UserModel.create({
      name: 'Ramesh Patel',
      email: 'casa.craft@example.com',
      password: 'Vendor@12345',
      role: 'vendor',
      phone: '+91 98000 00003',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    });
    const vendor2Profile = await VendorProfileModel.create({
      userId: vendor2._id,
      storeName: 'Casa Craft Home',
      businessEmail: 'contact@casacraft.in',
      businessPhone: '+91 98000 00003',
      businessAddress: 'Heritage Industrial Zone, Jaipur, Rajasthan',
      storeDescription: 'Handcrafted stoneware, oak decor, and artisanal homeware.',
      status: 'approved', isVerified: true, commissionRate: 10.0,
      totalEarnings: 22000.0, withdrawableBalance: 15400.0
    });

    // ── 4. Vendor 3: Urban Threads (Pending) ──────────────────────────────────
    const vendor3 = await UserModel.create({
      name: 'Kavita Sen',
      email: 'urban.threads@example.com',
      password: 'Vendor@12345',
      role: 'vendor',
      phone: '+91 98000 00004',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
    });
    await VendorProfileModel.create({
      userId: vendor3._id,
      storeName: 'Urban Threads & Co.',
      businessEmail: 'hello@urbanthreads.com',
      businessPhone: '+91 98000 00004',
      businessAddress: 'Fashion Street, Bandra West, Mumbai, Maharashtra',
      storeDescription: 'Sustainable organic cotton denim and contemporary streetwear.',
      status: 'pending', isVerified: false, commissionRate: 12.0
    });

    // ── 5. Customer ───────────────────────────────────────────────────────────
    await UserModel.create({
      name: 'Priya Sharma',
      email: 'priya.buyer@example.com',
      password: 'Customer@12345',
      role: 'customer',
      phone: '+91 98765 11223',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      address: { street: 'Flat 402, Sunset Towers', city: 'Mumbai', state: 'Maharashtra', postalCode: '400002', country: 'India' }
    });

    // ── 6. Categories ─────────────────────────────────────────────────────────
    const categoryData = [
      { name: 'Electronics',     slug: 'electronics',      icon: '📱', description: 'Gadgets, phones, laptops and accessories.', displayOrder: 1, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80' },
      { name: 'Fashion',         slug: 'fashion',           icon: '👗', description: 'Clothing, footwear and accessories for men and women.', displayOrder: 2, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80' },
      { name: 'Home & Kitchen',  slug: 'home-kitchen',      icon: '🏠', description: 'Furniture, kitchen appliances and home décor.', displayOrder: 3, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80' },
      { name: 'Sports',          slug: 'sports',            icon: '⚽', description: 'Sporting goods, fitness equipment and outdoor gear.', displayOrder: 4, image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80' },
      { name: 'Books',           slug: 'books',             icon: '📚', description: 'Fiction, non-fiction, academic and educational books.', displayOrder: 5, image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80' },
      { name: 'Beauty & Health', slug: 'beauty-health',     icon: '💄', description: 'Skincare, haircare and wellness products.', displayOrder: 6, image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80' }
    ];

    const categories = {};
    for (const cat of categoryData) {
      const created = await CategoryModel.create(cat);
      categories[cat.slug] = created._id;
    }

    // ── 7. Sample Products ────────────────────────────────────────────────────
    const sampleProducts = [
      // Apex Electronics products
      {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise cancelling with two processors and eight microphones. Crystal clear hands-free calling with precise voice pickup. Up to 30-hour battery life.',
        shortDescription: 'Premium ANC wireless headphones with 30hr battery.',
        price: 29990, discountPercent: 15, stock: 45, isAvailable: true,
        category: categories['electronics'],
        vendor: vendor1._id, vendorProfile: vendor1Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'],
        tags: ['headphones', 'sony', 'wireless', 'noise-cancelling'], rating: { average: 4.7, count: 234 }, totalSales: 89
      },
      {
        name: 'Apple AirPods Pro (3rd Generation)',
        description: 'Active Noise Cancellation reduces unwanted background noise. Transparency mode lets you hear your environment. Adaptive Audio seamlessly transitions between modes.',
        shortDescription: 'ANC earbuds with spatial audio and USB-C charging.',
        price: 24900, discountPercent: 8, stock: 30, isAvailable: true,
        category: categories['electronics'],
        vendor: vendor1._id, vendorProfile: vendor1Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=400&q=80'],
        tags: ['airpods', 'apple', 'earbuds', 'wireless'], rating: { average: 4.8, count: 567 }, totalSales: 154
      },
      {
        name: 'Samsung Galaxy S24 Ultra 5G',
        description: 'Powered by Snapdragon 8 Gen 3 for Galaxy. 200MP camera with AI enhancements. Built-in S Pen. 5000mAh battery with 45W fast charging.',
        shortDescription: 'Flagship 5G phone with S Pen and 200MP camera.',
        price: 134999, discountPercent: 5, stock: 18, isAvailable: true,
        category: categories['electronics'],
        vendor: vendor1._id, vendorProfile: vendor1Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?auto=format&fit=crop&w=400&q=80'],
        tags: ['samsung', 'galaxy', '5g', 'smartphone'], rating: { average: 4.6, count: 189 }, totalSales: 42
      },
      {
        name: 'Boat Airdopes 141 Bluetooth Earbuds',
        description: 'True Wireless Stereo earbuds with 42Hr total playback. IPX4 water resistance. BEAST Mode for ultra-low latency gaming. IWP Technology for instant connectivity.',
        shortDescription: 'Budget TWS earbuds with 42Hr battery & BEAST mode.',
        price: 1499, discountPercent: 40, stock: 200, isAvailable: true,
        category: categories['electronics'],
        vendor: vendor1._id, vendorProfile: vendor1Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80'],
        tags: ['boat', 'earbuds', 'budget', 'tws'], rating: { average: 4.1, count: 1240 }, totalSales: 678
      },
      // Casa Craft Home products
      {
        name: 'Handcrafted Oak Wood Serving Tray',
        description: 'Solid oak wood serving tray with handles, perfect for breakfast in bed or entertaining. Food-safe finish. Dimensions: 45cm × 30cm × 6cm.',
        shortDescription: 'Solid oak serving tray with handles, food-safe finish.',
        price: 2499, discountPercent: 10, stock: 75, isAvailable: true,
        category: categories['home-kitchen'],
        vendor: vendor2._id, vendorProfile: vendor2Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=400&q=80'],
        tags: ['wood', 'oak', 'serving', 'kitchen'], rating: { average: 4.5, count: 98 }, totalSales: 56
      },
      {
        name: 'Handmade Ceramic Dinner Set (6 Pieces)',
        description: 'Artisan-made stoneware dinner plates with a rustic glazed finish. Microwave and dishwasher safe. Each set is unique with slight natural variations.',
        shortDescription: '6-piece artisan stoneware dinner set, dishwasher safe.',
        price: 3999, discountPercent: 20, stock: 40, isAvailable: true,
        category: categories['home-kitchen'],
        vendor: vendor2._id, vendorProfile: vendor2Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=400&q=80'],
        tags: ['ceramic', 'dinner set', 'stoneware', 'artisan'], rating: { average: 4.6, count: 67 }, totalSales: 34
      },
      {
        name: 'Scented Soy Wax Candle Set (Pack of 3)',
        description: 'Hand-poured soy wax candles in three relaxing fragrances: Lavender, Vanilla & Sandalwood. 40-hour burn time per candle. Cotton wick, vegan and cruelty-free.',
        shortDescription: '3x soy wax candles — 40hr burn, vegan, cotton wick.',
        price: 899, discountPercent: 0, stock: 120, isAvailable: true,
        category: categories['home-kitchen'],
        vendor: vendor2._id, vendorProfile: vendor2Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?auto=format&fit=crop&w=400&q=80'],
        tags: ['candle', 'soy', 'lavender', 'home'], rating: { average: 4.4, count: 203 }, totalSales: 145
      },
      {
        name: 'Bamboo Yoga Mat (6mm, Eco-Friendly)',
        description: 'Premium natural bamboo & rubber yoga mat with non-slip surface. 6mm cushioning for joint support. Size: 183cm × 61cm. Comes with carry strap.',
        shortDescription: 'Eco bamboo yoga mat, 6mm, non-slip, with carry strap.',
        price: 1799, discountPercent: 12, stock: 60, isAvailable: true,
        category: categories['sports'],
        vendor: vendor2._id, vendorProfile: vendor2Profile._id,
        thumbnail: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=400&q=80'],
        tags: ['yoga', 'mat', 'bamboo', 'eco'], rating: { average: 4.3, count: 112 }, totalSales: 78
      }
    ];

    for (const p of sampleProducts) {
      await ProductModel.create(p);
    }

    console.log('[Seed] Initial accounts seeded successfully!');
    console.log('       Admin:    admin@multicart.com       / Admin@12345');
    console.log('       Vendor 1: apex.seller@example.com   / Vendor@12345 (Approved)');
    console.log('       Vendor 2: casa.craft@example.com    / Vendor@12345 (Approved)');
    console.log('       Vendor 3: urban.threads@example.com / Vendor@12345 (Pending)');
    console.log('       Customer: priya.buyer@example.com   / Customer@12345');
    console.log(`[Seed] Created ${categoryData.length} categories and ${sampleProducts.length} sample products.`);
  } catch (error) {
    console.error('[Seed Error]', error.message);
  }
};
