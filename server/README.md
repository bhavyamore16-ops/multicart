# MultiCart Backend Application Tier (Node.js & Express)

This directory will contain the RESTful API server for the MultiCart multi-vendor e-commerce platform.

## Planned Architecture:
- `src/config/`: Database and Cloudinary connection configurations
- `src/controllers/`: Request handling logic for Auth, Products, Orders, Vendors, Admin, and Reviews
- `src/middleware/`: JWT verification, Role-Based Access Control (RBAC), error handling, and file upload middlewares
- `src/models/`: Mongoose schemas (User, VendorProfile, Category, Product, Cart, MasterOrder, VendorOrder, Review, Payout)
- `src/routes/`: Express endpoint routing
- `src/services/`: Multi-vendor Split-Order processing engine and payment services
- `src/utils/`: Response helpers, validators, and token generators
- `server.js`: Server entry point listening on port 5000

*Implementation will begin in Phase 2 in accordance with the project roadmap.*
