export const CATEGORIES = [
  {
    id: "cat-1",
    name: "Consumer Electronics",
    slug: "consumer-electronics",
    icon: "Smartphone",
    itemCount: 42,
    description: "Smartphones, premium headphones, ultra-wide monitors, and accessories.",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-2",
    name: "Fashion & Apparel",
    slug: "fashion-apparel",
    icon: "Shirt",
    itemCount: 78,
    description: "Trending street wear, ethnic wear, denim jackets, and summer dresses.",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-3",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    icon: "Home",
    itemCount: 35,
    description: "Smart appliances, culinary cookware, ergonomic desk lamps, and decor.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-4",
    name: "Footwear & Sports",
    slug: "footwear-sports",
    icon: "Footprints",
    itemCount: 29,
    description: "Performance running shoes, sneakers, yoga equipment, and fitness trackers.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-5",
    name: "Books & Stationery",
    slug: "books-stationery",
    icon: "BookOpen",
    itemCount: 51,
    description: "Academic textbooks, bestselling fiction, leather journals, and art supplies.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-6",
    name: "Beauty & Personal Care",
    slug: "beauty-care",
    icon: "Sparkles",
    itemCount: 44,
    description: "Organic skincare, grooming kits, perfumes, and dermatological essentials.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80"
  }
];

export const VENDORS = [
  {
    id: "vnd-1",
    name: "Apex Electronics",
    slug: "apex-electronics",
    rating: 4.8,
    reviews: 240,
    storeLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    verified: true,
    location: "Bengaluru, Karnataka",
    joinedDate: "January 2024"
  },
  {
    id: "vnd-2",
    name: "Urban Threads & Co.",
    slug: "urban-threads",
    rating: 4.6,
    reviews: 185,
    storeLogo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    banner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    verified: true,
    location: "Mumbai, Maharashtra",
    joinedDate: "March 2024"
  },
  {
    id: "vnd-3",
    name: "Casa Craft Home",
    slug: "casa-craft",
    rating: 4.9,
    reviews: 310,
    storeLogo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    banner: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    verified: true,
    location: "Jaipur, Rajasthan",
    joinedDate: "October 2023"
  },
  {
    id: "vnd-4",
    name: "Stride Sports India",
    slug: "stride-sports",
    rating: 4.7,
    reviews: 142,
    storeLogo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    banner: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    verified: true,
    location: "New Delhi",
    joinedDate: "May 2024"
  }
];

export const PRODUCTS = [
  {
    id: "prod-1",
    name: "Aura Pro Wireless ANC Headphones",
    slug: "aura-pro-wireless-headphones",
    category: "Consumer Electronics",
    categorySlug: "consumer-electronics",
    vendorId: "vnd-1",
    vendorName: "Apex Electronics",
    price: 4999,
    originalPrice: 7999,
    discount: "38% OFF",
    rating: 4.8,
    reviewCount: 148,
    stock: 24,
    isFeatured: true,
    isLatest: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Industry-leading active noise cancellation with 40-hour battery life, high-res audio drivers, and memory foam ear cushions for all-day comfort.",
    features: [
      "Hybrid Active Noise Cancellation (up to 38dB reduction)",
      "40mm High-Fidelity Neodymium Dynamic Drivers",
      "Up to 40 Hours Playback with Fast USB-C Charging (10m = 5h)",
      "Multipoint Bluetooth 5.3 connection to two devices"
    ],
    sku: "APX-AURA-01"
  },
  {
    id: "prod-2",
    name: "Classic Heritage Denim Jacket",
    slug: "classic-heritage-denim-jacket",
    category: "Fashion & Apparel",
    categorySlug: "fashion-apparel",
    vendorId: "vnd-2",
    vendorName: "Urban Threads & Co.",
    price: 1999,
    originalPrice: 3499,
    discount: "43% OFF",
    rating: 4.6,
    reviewCount: 92,
    stock: 18,
    isFeatured: true,
    isLatest: false,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
    ],
    description: "100% ring-spun organic cotton denim jacket tailored with dual chest flap pockets, antique brass buttons, and reinforced double-stitching.",
    features: [
      "100% Rigid Heavyweight Organic Cotton",
      "Pre-washed vintage stone aesthetic",
      "Machine washable with color-lock technology",
      "Slim-regular unisex fit"
    ],
    sku: "UT-DENIM-09"
  },
  {
    id: "prod-3",
    name: "Smart Chrono Watch Ultra Edition",
    slug: "smart-chrono-watch-ultra",
    category: "Consumer Electronics",
    categorySlug: "consumer-electronics",
    vendorId: "vnd-1",
    vendorName: "Apex Electronics",
    price: 3499,
    originalPrice: 5999,
    discount: "42% OFF",
    rating: 4.7,
    reviewCount: 215,
    stock: 35,
    isFeatured: true,
    isLatest: true,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80"
    ],
    description: "1.96-inch AMOLED always-on display with comprehensive health monitoring: continuous SpO2, heart rate, sleep metrics, and Bluetooth calling.",
    features: [
      "1.96-inch HD AMOLED Display with 600 nits peak brightness",
      "IP68 Waterproof rating up to 50 meters",
      "Over 120 sports modes with auto workout detection",
      "Up to 10 days battery endurance on single charge"
    ],
    sku: "APX-CHRONO-77"
  },
  {
    id: "prod-4",
    name: "Artisan Pour-Over Ceramic Coffee Set",
    slug: "artisan-ceramic-coffee-set",
    category: "Home & Kitchen",
    categorySlug: "home-kitchen",
    vendorId: "vnd-3",
    vendorName: "Casa Craft Home",
    price: 1499,
    originalPrice: 2299,
    discount: "35% OFF",
    rating: 4.9,
    reviewCount: 64,
    stock: 12,
    isFeatured: true,
    isLatest: false,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Handcrafted stoneware dripper with insulated server carafe. Designed to extract deep aromatic notes for artisanal coffee connoisseurs.",
    features: [
      "Lead-free food grade ceramic construction",
      "600ml carafe capacity with drip-free spout",
      "Includes reusable stainless steel micro-mesh filter",
      "Dishwasher and microwave safe"
    ],
    sku: "CC-COFFEE-03"
  },
  {
    id: "prod-5",
    name: "Air-Stride Cushioned Performance Sneakers",
    slug: "air-stride-cushioned-sneakers",
    category: "Footwear & Sports",
    categorySlug: "footwear-sports",
    vendorId: "vnd-4",
    vendorName: "Stride Sports India",
    price: 2799,
    originalPrice: 4499,
    discount: "38% OFF",
    rating: 4.7,
    reviewCount: 110,
    stock: 20,
    isFeatured: false,
    isLatest: true,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Engineered breathable knit upper combined with responsive nitrogen-infused foam sole for energy return during runs or casual everyday walks.",
    features: [
      "Breathable engineered fly-knit mesh",
      "Shock absorption heel cushioning",
      "Anti-skid textured rubber outsole",
      "Ultra-lightweight (240g per shoe)"
    ],
    sku: "SS-STRIDE-88"
  },
  {
    id: "prod-6",
    name: "Minimalist Scandinavian Oak Desk Lamp",
    slug: "minimalist-oak-desk-lamp",
    category: "Home & Kitchen",
    categorySlug: "home-kitchen",
    vendorId: "vnd-3",
    vendorName: "Casa Craft Home",
    price: 1899,
    originalPrice: 2899,
    discount: "34% OFF",
    rating: 4.8,
    reviewCount: 45,
    stock: 15,
    isFeatured: false,
    isLatest: true,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Solid natural oak base with matte aluminum shade. Features three dimmable light temperatures and an integrated fast USB charging port.",
    features: [
      "Solid sustainably sourced oak timber",
      "3 CCT color temperatures (Warm, Natural, Cool)",
      "Touch sensitive step-less dimming",
      "5V/2A USB auxiliary charging output"
    ],
    sku: "CC-LAMP-12"
  },
  {
    id: "prod-7",
    name: "Organic Ayurvedic Botanical Facial Oil",
    slug: "organic-ayurvedic-facial-oil",
    category: "Beauty & Personal Care",
    categorySlug: "beauty-care",
    vendorId: "vnd-2",
    vendorName: "Urban Threads & Co.",
    price: 899,
    originalPrice: 1299,
    discount: "31% OFF",
    rating: 4.9,
    reviewCount: 78,
    stock: 40,
    isFeatured: false,
    isLatest: true,
    image: "https://images.unsplash.com/photo-1608248597359-25f0a0c6444d?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1608248597359-25f0a0c6444d?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Pure Kumkumadi cold-pressed elixir infused with Kashmiri saffron, lotus stamens, and sandalwood to nourish and illuminate skin.",
    features: [
      "100% Certified Organic cold-pressed formulation",
      "Free of parabens, mineral oils, and sulfates",
      "Dermatologically tested for all skin types",
      "30ml amber glass dropper bottle"
    ],
    sku: "UT-OIL-05"
  },
  {
    id: "prod-8",
    name: "Handmade Vintage Refillable Leather Journal",
    slug: "handmade-leather-journal",
    category: "Books & Stationery",
    categorySlug: "books-stationery",
    vendorId: "vnd-3",
    vendorName: "Casa Craft Home",
    price: 749,
    originalPrice: 1199,
    discount: "37% OFF",
    rating: 4.8,
    reviewCount: 130,
    stock: 25,
    isFeatured: false,
    isLatest: false,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Genuine full-grain buffalo leather journal containing 200 pages of handmade recycled cotton deckle-edge paper. Ideal for sketching and journaling.",
    features: [
      "Authentic distressed full-grain leather cover",
      "200 pages (100 sheets) of 120gsm tree-free cotton paper",
      "Wrap-around leather strap closure",
      "Fountain pen friendly with zero bleed-through"
    ],
    sku: "CC-JOURNAL-21"
  }
];

export const TESTIMONIALS = [
  {
    id: "t-1",
    name: "Priya Sharma",
    role: "Verified Buyer",
    city: "Mumbai",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "The ability to purchase from multiple verified Indian vendors in a single checkout cart made my shopping effortless. Deliveries arrived quickly with clear tracking!"
  },
  {
    id: "t-2",
    name: "Vikram Malhotra",
    role: "Store Owner @ Apex Electronics",
    city: "Bengaluru",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "MultiCart's vendor portal gives us total control over our product catalogs, inventory alerts, and payouts. Our sales grew 45% in just three months."
  },
  {
    id: "t-3",
    name: "Ananya Iyer",
    role: "Verified Buyer",
    city: "Chennai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "Finding authentic handcrafted items directly from artisans alongside gadgets in the same store is fantastic. Customer service is prompt and dependable."
  }
];
