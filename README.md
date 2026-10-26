# Inventory & Order Management System (IOMS) Full-Stack Application

A multi-tenant full-stack application generated strictly according to `Node_Project_Generation_Test_BRD.docx` and `INSTRUCTION.md`.

## Project Location & Structure
- **Root Directory**: `/Users/PI-IN-190/Documents/Node_Project_Generation_Test`
- **Frontend**: React.js + TypeScript + Vite (`/frontend`)
- **Backend**: Node.js + Express.js + Prisma ORM + TypeScript (`/backend`)
- **Pipeline Artifacts**: `.orchestai/reviews/trace_entity_review.json`, `design.md`

```text
Node_Project_Generation_Test/
├── frontend/             # React.js SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── components/   # Navbar, RoleDemoSelector
│   │   ├── context/      # Auth & Tenant context
│   │   ├── pages/        # Dashboard, Products, Inventory, Orders
│   │   └── services/     # Axios REST client
│   └── package.json
├── backend/              # Node.js REST API Server (Express + Prisma)
│   ├── src/
│   │   ├── modules/      # Auth, Products, Inventory, Orders
│   │   ├── shared/       # JWT Auth, Tenant Isolation, Error Handler
│   │   └── tests/        # Vitest suite
│   ├── prisma/           # Database schema & migrations
│   └── package.json
├── design.md             # System Design & ERD specification
└── docker-compose.yml    # PostgreSQL container configuration
```

---

## Technical Features & Requirements Implemented

1. **Multi-Tenant Isolation**: Enforced on every database query using `tenantId` filtering and JWT Bearer token payloads.
2. **Product Management**:
   - `POST /api/v1/products` (ADMIN only) - Create product with SKU uniqueness check per tenant.
   - `GET /api/v1/products` (ADMIN, USER) - Paginated active products list.
   - `PATCH /api/v1/products/:id` (ADMIN) - Update product details.
   - `DELETE /api/v1/products/:id` (ADMIN) - Deactivate product (deactivated items blocked from new orders).
3. **Inventory Management**:
   - `GET /api/v1/products/:id/inventory` (ADMIN, USER) - View stock levels.
   - `POST /api/v1/products/:id/inventory/adjust` (ADMIN) - Add or reduce stock with non-negative validation and audit logs.
4. **Order Management**:
   - `POST /api/v1/orders` (USER) - Atomic order creation (validates active products, verifies sufficient inventory, deducts stock atomically, calculates server-side price totals).
   - `GET /api/v1/orders` - USER sees own orders; ADMIN sees all tenant orders.
   - `PATCH /api/v1/orders/:id/status` (ADMIN) - Lifecycle state transitions (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
5. **OpenAPI / Swagger Documentation**: Available at `http://localhost:5001/api-docs`.

---

## Instructions to Run the Application

### 1. Run Backend Server (Node.js)
```bash
cd /Users/PI-IN-190/Documents/Node_Project_Generation_Test/backend
npm install
npm run test     # Run Vitest unit & integration tests
npm run dev      # Starts Express API at http://localhost:5001
```

### 2. Run Frontend Application (React.js)
```bash
cd /Users/PI-IN-190/Documents/Node_Project_Generation_Test/frontend
npm install
npm run dev      # Starts React Vite SPA at http://localhost:3000
```

---

## Testing & Quality Assurance
Run automated tests in backend:
```bash
cd backend
npm run test
```
Verifies:
- Tenant isolation (Tenant A cannot access Tenant B resources)
- SKU uniqueness per tenant
- Insufficient inventory order creation rollback
- Role permissions (`ADMIN` vs `USER`)
