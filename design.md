# System Architecture & Design Specification

## Overview
The Inventory & Order Management System (IOMS) is a multi-tenant full-stack application comprising a **Node.js + TypeScript REST API backend** and a **React.js + Vite frontend**.

## Architecture & Technology Stack

### Backend Stack
- **Runtime**: Node.js (v18+) with TypeScript
- **Framework**: Express.js
- **Database / ORM**: PostgreSQL with Prisma ORM
- **Validation**: Zod schema validation
- **Security**: JWT Bearer authentication, Role-Based Access Control (RBAC), Helmet HTTP headers, CORS origin whitelist, express-rate-limit
- **Documentation**: OpenAPI 3.0 / Swagger UI (`/api-docs`)
- **Testing**: Vitest & Supertest suite

### Frontend Stack
- **Framework**: React.js (v18+) with TypeScript & Vite
- **UI & Styling**: Modern Glassmorphism Vanilla/Utility CSS with Lucide Icons
- **State & Router**: React Context (Auth & Tenant state) + React Router v6
- **HTTP Client**: Axios with automatic JWT Bearer token & Tenant ID headers

---

## Entity ERD & Data Schema Mapping

| Entity | Fields | Constraints / Indexes |
| --- | --- | --- |
| **Tenant** | `id`, `name`, `status`, `createdAt` | Primary Key: `id` |
| **User** | `id`, `tenantId`, `username`, `role`, `status`, `createdAt` | FK: `tenantId -> Tenant.id`, Role: `ADMIN` \| `USER` |
| **Product** | `id`, `tenantId`, `name`, `sku`, `description`, `price`, `active`, `createdAt`, `updatedAt` | FK: `tenantId`, Unique constraint: `(tenantId, sku)` |
| **Inventory** | `id`, `tenantId`, `productId`, `availableQuantity`, `updatedAt`, `updatedBy` | Unique: `(tenantId, productId)`, Constraint: `availableQuantity >= 0` |
| **Order** | `id`, `tenantId`, `userId`, `status`, `totalAmount`, `createdAt`, `updatedAt` | FK: `tenantId`, `userId`, Status: `PENDING` \| `CONFIRMED` \| `CANCELLED` \| `COMPLETED` |
| **OrderItem** | `id`, `orderId`, `productId`, `quantity`, `unitPrice`, `lineTotal` | FK: `orderId -> Order.id`, `productId -> Product.id` |
| **InventoryTransaction** | `id`, `tenantId`, `productId`, `quantityChange`, `reason`, `createdBy`, `createdAt` | FK: `tenantId`, `productId` |

---

## API Endpoint Route Contracts

| Method | Endpoint | Description | Role Required |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Obtain test JWT token for Tenant & Role | Public |
| `POST` | `/api/v1/products` | Create a new product | `ADMIN` |
| `GET` | `/api/v1/products` | List active products (paginated) | `ADMIN`, `USER` |
| `GET` | `/api/v1/products/:id` | Get product details | `ADMIN`, `USER` |
| `PATCH` | `/api/v1/products/:id` | Update product details | `ADMIN` |
| `DELETE` | `/api/v1/products/:id` | Deactivate product | `ADMIN` |
| `GET` | `/api/v1/products/:id/inventory` | Get product inventory levels | `ADMIN`, `USER` |
| `POST` | `/api/v1/products/:id/inventory/adjust` | Add/Reduce inventory | `ADMIN` |
| `POST` | `/api/v1/orders` | Create an order atomically | `USER` |
| `GET` | `/api/v1/orders` | List orders (USER sees own, ADMIN sees tenant) | `ADMIN`, `USER` |
| `GET` | `/api/v1/orders/:id` | Get order details | `ADMIN`, `USER` |
| `PATCH` | `/api/v1/orders/:id/status` | Update order status | `ADMIN` |
| `GET` | `/health` | Liveness and readiness health probe | Public |
