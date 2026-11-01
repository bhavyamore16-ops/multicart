# MultiCart Frontend Client Application (React.js + Tailwind CSS)

This directory contains the production-ready Single Page Application (SPA) for the MultiCart multi-vendor marketplace, developed for the B.Sc. Computer Science Final Year Project.

## 🚀 Features Implemented (Phase 2):
- **Responsive Navigation Bar (`Navbar.jsx`):** MultiCart logo, navigation links, live cart badge, role-aware user menu, mobile collapsible drawer.
- **Dynamic Hero Banner (`HeroBanner.jsx`):** Shopping-focused typography, "Shop Now" and "Become a Seller" CTAs, value metric counters.
- **Product Categories:** 6 curated category cards with listed item counts and banner links.
- **Featured & Latest Products:** Filtered product lists rendered with reusable `ProductCard` components.
- **Product Cards (`ProductCard.jsx`):** Multi-vendor seller tag, pricing in Indian Rupees (₹), original price strikethrough, discount pill, star ratings, and instant "Add to Cart" with quantity sync.
- **Full-Faceted Catalog (`Products.jsx`):** Category filter, price range slider (₹500 to ₹8,000+), vendor selector, star rating filters, fuzzy search, and dynamic sorting.
- **Detailed Product View (`ProductDetails.jsx`):** Multi-image gallery with thumbnail switcher, vendor credentials, SKU, stock count, quantity step selector, verified customer reviews, and related items.
- **Multi-Vendor Cart (`Cart.jsx`):** Segregates products by vendor store with individual vendor subtotal headers, quantity increment/decrement, and checkout decomposition simulation.
- **Authentication Pages (`Login.jsx` & `Register.jsx`):** Role switcher (Customer, Vendor, Admin), dynamic vendor store registration fields, and one-click demo logins for faculty evaluation.
- **Informational Pages (`AboutUs.jsx` & `ContactUs.jsx`):** System architectural pillars, headquarters details, inquiry transmission form, and interactive FAQ accordion.
- **Global Contexts:**
  - `CartContext.jsx`: Cross-page persistent cart state in `localStorage`, multi-vendor item aggregation, and animated toast feedback.
  - `AuthContext.jsx`: Client authentication and role-based permissions (`Customer`, `Vendor`, `Admin`).

## 🛠️ Tech Stack:
- React 18
- Tailwind CSS 3
- React Router DOM 6
- Lucide React (Icons)
- Vite 6

## 📦 How to Run:
```bash
# In the client directory:
npm install
npm run dev
```
The application will launch at `http://localhost:3000`.
