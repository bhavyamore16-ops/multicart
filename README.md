# MultiCart – Multi-Vendor E-Commerce Shopping Website

> **B.Sc. Computer Science Final-Year Project**  
> Complete Software Requirements Specification (SRS), Architecture Design, and Development Plan.

---

## 📌 Project Overview
**MultiCart** is an enterprise-grade multi-vendor e-commerce platform developed using the **MERN** stack (MongoDB, Express.js, React.js, Node.js). 

Unlike conventional single-owner online stores, MultiCart empowers multiple independent merchants to register virtual storefronts, catalogue products, and manage sub-order fulfillment, while providing consumers with a seamless single-cart multi-vendor shopping experience.

---

## 📁 Repository Structure
```
MultiCart/
├── docs/                       # Complete Academic & Engineering Documentation
│   ├── SRS.md                  # IEEE Std 830-1998 Software Requirements Specification (Markdown)
│   ├── SRS.docx                # Formatted Microsoft Word Document for Project Submission
│   └── scripts/
│       └── generate_docx.py    # Python script to regenerate SRS.docx from markdown
├── client/                     # React.js Single Page Application (Planned)
└── server/                     # Node.js + Express.js RESTful API Backend (Planned)
```

---

## 🛠️ Technology Stack
- **Frontend:** React.js (v18+), React Router DOM (v6+), Tailwind CSS, Axios, Lucide Icons
- **Backend:** Node.js (v20+ LTS), Express.js (v4.19+ / v5.0)
- **Database:** MongoDB Community Server / MongoDB Atlas, Mongoose ODM (v8+)
- **Authentication:** Stateless JSON Web Tokens (JWT) & `bcryptjs` password hashing
- **Media Storage:** Cloudinary Media API (Multipart uploads via Multer)
- **Payments:** Stripe / Razorpay (Sandbox) & Cash on Delivery (COD)

---

## 👥 User Roles & Access Hierarchy
1. **System Administrator (Super Admin):** Platform governance, vendor verification & store onboarding, category taxonomy management, commission configuration (default 10%), catalog moderation, payout authorization, and executive analytics.
2. **Vendor (Merchant):** Storefront profile customization, product cataloging (images, variants, stock), isolated sub-order management (Pending -> Processing -> Shipped -> Delivered), courier tracking assignment, sales ledger, and withdrawal requests.
3. **Customer (Shopper):** Dynamic product discovery, multi-faceted filtering (category, price, rating, vendor), multi-vendor cart with vendor grouping, unified checkout, sub-order tracking timeline, and verified product reviews.

---

## 📑 Core Documentation
The complete IEEE-style Software Requirements Specification is available in both Markdown and Microsoft Word formats:
- 📖 [docs/SRS.md](file:///d:/Multi-vendor/docs/SRS.md) – Formatted Markdown with Mermaid sequence and ER diagrams.
- 📄 [docs/SRS.docx](file:///d:/Multi-vendor/docs/SRS.docx) – Styled Microsoft Word Document with custom cover page, headers, and formatted tables for academic submission.

---

## 🗺️ 16-Week Development Roadmap

| Phase | Duration | Scope & Deliverables |
| :---: | :---: | :--- |
| **Phase 1** | Weeks 1 – 2 | Requirements Inception, IEEE SRS Documentation, ER Modeling & Architecture |
| **Phase 2** | Weeks 3 – 4 | Express Server Setup, MongoDB Schemas, JWT Authentication & RBAC Middleware |
| **Phase 3** | Weeks 5 – 6 | Vendor Storefront APIs, Cloudinary Image Pipeline, Product CRUD & Stock Management |
| **Phase 4** | Weeks 7 – 8 | React Client Setup, Tailwind Design System, Catalog Search, Filter & Multi-Vendor Cart |
| **Phase 5** | Weeks 9 – 10 | Split-Order Processing Engine, Checkout Workflow & Stripe Payment Integration |
| **Phase 6** | Weeks 11 – 12 | Admin Governance Console, Commission Rules, Payout Engine & Review System |
| **Phase 7** | Weeks 13 – 14 | Quality Assurance, Unit/Integration Testing, Security Auditing (OWASP) & UAT |
| **Phase 8** | Weeks 15 – 16 | Cloud Deployment (Render/Vercel), Project Dissertation Report & Final Defense |

---

## ⚖️ Project Status
- **Current Status:** Phase 5 Customer Shopping is implemented with live catalog browsing, customer carts, and wishlists.
- **Next Step:** Implement checkout, payment, and split-order processing.
