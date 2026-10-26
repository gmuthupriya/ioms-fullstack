import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

process.env.USE_MEMORY_DB = 'true';

describe('Inventory & Order Management API Integration Tests', () => {
  let app: any;
  let adminTokenTenantA: string;
  let userTokenTenantA: string;
  let user2TokenTenantA: string;
  let adminTokenTenantB: string;

  beforeAll(() => {
    app = createApp();

    adminTokenTenantA = jwt.sign(
      { sub: 'usr_admin1', username: 'admin1', role: 'ADMIN', tenantId: 'tenant-alpha' },
      env.JWT_SECRET
    );
    userTokenTenantA = jwt.sign(
      { sub: 'usr_user1', username: 'user1', role: 'USER', tenantId: 'tenant-alpha' },
      env.JWT_SECRET
    );
    user2TokenTenantA = jwt.sign(
      { sub: 'usr_user2', username: 'user2', role: 'USER', tenantId: 'tenant-alpha' },
      env.JWT_SECRET
    );
    adminTokenTenantB = jwt.sign(
      { sub: 'usr_admin_beta', username: 'admin_beta', role: 'ADMIN', tenantId: 'tenant-beta' },
      env.JWT_SECRET
    );
  });

  it('GET /health - should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('POST /api/v1/products - USER role should be rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${userTokenTenantA}`)
      .send({
        name: 'Test Product',
        sku: 'SKU-001',
        price: 100,
      });
    expect(res.status).toBe(403);
  });

  it('POST /api/v1/products - ADMIN role should create product & initial stock', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminTokenTenantA}`)
      .send({
        name: 'Laptop Computer',
        sku: 'SKU-LAPTOP-01',
        description: 'High performance laptop',
        price: 1200,
        initialQuantity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe('SKU-LAPTOP-01');
    expect(res.body.data.availableQuantity).toBe(10);
  });

  it('POST /api/v1/products - duplicate SKU in same tenant should return 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminTokenTenantA}`)
      .send({
        name: 'Laptop Duplicate',
        sku: 'SKU-LAPTOP-01',
        price: 1200,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('Tenant Isolation - Tenant B should NOT see Tenant A products', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${adminTokenTenantB}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('POST /api/v1/orders - USER can create order when inventory is sufficient', async () => {
    // 1. Get Product ID created earlier
    const prodRes = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${userTokenTenantA}`);

    const product = prodRes.body.data.find((p: any) => p.sku === 'SKU-LAPTOP-01');
    const productId = product.id;

    // 2. Create Order for 2 units (Price: 1200 * 2 = 2400)
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userTokenTenantA}`)
      .send({
        items: [{ productId, quantity: 2 }],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.totalAmount).toBe(2400);
    expect(orderRes.body.data.status).toBe('PENDING');

    // 3. Verify remaining stock reduced to 8 (10 - 2)
    const invRes = await request(app)
      .get(`/api/v1/products/${productId}/inventory`)
      .set('Authorization', `Bearer ${userTokenTenantA}`);

    expect(invRes.body.data.availableQuantity).toBe(8);
  });

  it('POST /api/v1/orders - Order creation fails with 409 Conflict when quantity exceeds stock', async () => {
    const prodRes = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${userTokenTenantA}`);

    const product = prodRes.body.data.find((p: any) => p.sku === 'SKU-LAPTOP-01');
    const productId = product.id;

    // Request 50 units when only 8 are available
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userTokenTenantA}`)
      .send({
        items: [{ productId, quantity: 50 }],
      });

    expect(orderRes.status).toBe(409);
    expect(orderRes.body.error.code).toBe('CONFLICT');
  });

  it('GET /api/v1/orders - USER cannot view another USER orders', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${user2TokenTenantA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0); // User 2 has no orders
  });
});
