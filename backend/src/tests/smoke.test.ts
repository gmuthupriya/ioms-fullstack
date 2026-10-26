import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

process.env.USE_MEMORY_DB = 'true';

describe('MANDATORY CRUD SMOKE TEST & VALIDATION PIPELINE', () => {
  let app: any;
  let adminTokenAlpha: string;
  let userTokenAlpha: string;
  let user2TokenAlpha: string;
  let adminTokenBeta: string;

  beforeAll(() => {
    app = createApp();

    adminTokenAlpha = jwt.sign(
      { sub: 'usr_admin_alpha', username: 'alpha_admin', role: 'ADMIN', tenantId: 'tenant-alpha' },
      env.JWT_SECRET
    );
    userTokenAlpha = jwt.sign(
      { sub: 'usr_user_alpha', username: 'alpha_user', role: 'USER', tenantId: 'tenant-alpha' },
      env.JWT_SECRET
    );
    user2TokenAlpha = jwt.sign(
      { sub: 'usr_user2_alpha', username: 'alpha_user2', role: 'USER', tenantId: 'tenant-alpha' },
      env.JWT_SECRET
    );
    adminTokenBeta = jwt.sign(
      { sub: 'usr_admin_beta', username: 'beta_admin', role: 'ADMIN', tenantId: 'tenant-beta' },
      env.JWT_SECRET
    );
  });

  // ==========================================
  // 1. PRODUCTS CRUD SMOKE TEST
  // ==========================================
  describe('PRODUCTS MODULE CRUD FLOW', () => {
    let createdProductId: string;

    it('CREATE: ADMIN creates product -> 201 Created & DB persisted', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({
          name: 'Mechanical Gaming Keyboard',
          sku: 'KEY-MECH-001',
          description: 'RGB Backlit Switch',
          price: 150.00,
          initialQuantity: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.sku).toBe('KEY-MECH-001');
      expect(res.body.data.availableQuantity).toBe(20);

      createdProductId = res.body.data.id;
    });

    it('READ / LIST: Retrieve product detail and verify in paginated list', async () => {
      // Detail GET
      const detailRes = await request(app)
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.name).toBe('Mechanical Gaming Keyboard');

      // List GET
      const listRes = await request(app)
        .get('/api/v1/products?activeOnly=true')
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.some((p: any) => p.id === createdProductId)).toBe(true);
    });

    it('UPDATE: ADMIN updates price & name -> 200 OK & persisted', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({
          name: 'Mechanical Gaming Keyboard Pro',
          price: 175.00,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Mechanical Gaming Keyboard Pro');
      expect(updateRes.body.data.price).toBe(175.00);

      // Verify persistence via GET
      const verifyRes = await request(app)
        .get(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(verifyRes.body.data.name).toBe('Mechanical Gaming Keyboard Pro');
      expect(verifyRes.body.data.price).toBe(175.00);
    });

    it('DEACTIVATE: ADMIN deactivates product -> inactive status verified', async () => {
      const deactRes = await request(app)
        .delete(`/api/v1/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminTokenAlpha}`);

      expect(deactRes.status).toBe(200);
      expect(deactRes.body.data.active).toBe(false);

      // Verify omitted when activeOnly=true
      const activeList = await request(app)
        .get('/api/v1/products?activeOnly=true')
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(activeList.body.data.some((p: any) => p.id === createdProductId)).toBe(false);
    });
  });

  // ==========================================
  // 2. INVENTORY CRUD SMOKE TEST
  // ==========================================
  describe('INVENTORY MODULE CRUD FLOW', () => {
    let inventoryProdId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({
          name: 'Ergonomic Standing Desk',
          sku: 'DESK-ERG-100',
          price: 450.00,
          initialQuantity: 15,
        });
      inventoryProdId = res.body.data.id;
    });

    it('READ: GET product inventory levels', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${inventoryProdId}/inventory`)
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(res.status).toBe(200);
      expect(res.body.data.availableQuantity).toBe(15);
    });

    it('ADJUST: ADMIN increases & decreases stock with audit logging', async () => {
      // Add +10 stock
      const addRes = await request(app)
        .post(`/api/v1/products/${inventoryProdId}/inventory/adjust`)
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({
          quantityChange: 10,
          reason: 'RESTOCK_SHIPMENT',
        });

      expect(addRes.status).toBe(200);
      expect(addRes.body.data.availableQuantity).toBe(25);

      // Audit Log check
      const txRes = await request(app)
        .get(`/api/v1/products/${inventoryProdId}/inventory/transactions`)
        .set('Authorization', `Bearer ${adminTokenAlpha}`);

      expect(txRes.status).toBe(200);
      expect(txRes.body.data.some((t: any) => t.reason === 'RESTOCK_SHIPMENT')).toBe(true);
    });

    it('NEGATIVE STOCK RULE: Reducing below zero yields 400 Bad Request', async () => {
      const badRes = await request(app)
        .post(`/api/v1/products/${inventoryProdId}/inventory/adjust`)
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({
          quantityChange: -1000,
          reason: 'INVALID_REDUCTION',
        });

      expect(badRes.status).toBe(400);
      expect(badRes.body.error.code).toBe('BAD_REQUEST');
    });
  });

  // ==========================================
  // 3. ORDERS CRUD SMOKE TEST & ATOMIC FULFILLMENT
  // ==========================================
  describe('ORDERS MODULE CRUD FLOW', () => {
    let orderProdId: string;
    let createdOrderId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({
          name: 'Noise Cancelling Headphones',
          sku: 'HEADPHONE-NC-02',
          price: 200.00,
          initialQuantity: 10,
        });
      orderProdId = res.body.data.id;
    });

    it('CREATE: USER creates order -> Atomic stock deduction & server price calculation', async () => {
      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userTokenAlpha}`)
        .send({
          items: [{ productId: orderProdId, quantity: 3 }],
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body.data.id).toBeDefined();
      expect(orderRes.body.data.totalAmount).toBe(600.00); // 200 * 3
      expect(orderRes.body.data.status).toBe('PENDING');

      createdOrderId = orderRes.body.data.id;

      // Verify Stock reduced to 7 (10 - 3)
      const invCheck = await request(app)
        .get(`/api/v1/products/${orderProdId}/inventory`)
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(invCheck.body.data.availableQuantity).toBe(7);
    });

    it('INSUFFICIENT INVENTORY CONFLICT: Creating order exceeding stock yields 409 Conflict', async () => {
      const failOrder = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userTokenAlpha}`)
        .send({
          items: [{ productId: orderProdId, quantity: 50 }],
        });

      expect(failOrder.status).toBe(409);
      expect(failOrder.body.error.code).toBe('CONFLICT');
    });

    it('READ / LIST: USER sees own orders; ADMIN sees all tenant orders', async () => {
      // User 1 sees their order
      const user1List = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userTokenAlpha}`);

      expect(user1List.body.data.some((o: any) => o.id === createdOrderId)).toBe(true);

      // User 2 sees 0 orders
      const user2List = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${user2TokenAlpha}`);

      expect(user2List.body.data.some((o: any) => o.id === createdOrderId)).toBe(false);

      // Admin sees user 1 order
      const adminList = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminTokenAlpha}`);

      expect(adminList.body.data.some((o: any) => o.id === createdOrderId)).toBe(true);
    });

    it('UPDATE STATUS: ADMIN updates order status to CONFIRMED', async () => {
      const statusRes = await request(app)
        .patch(`/api/v1/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminTokenAlpha}`)
        .send({ status: 'CONFIRMED' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status).toBe('CONFIRMED');
    });
  });

  // ==========================================
  // 4. MULTI-TENANT ISOLATION SMOKE TEST
  // ==========================================
  describe('MULTI-TENANT ISOLATION VALIDATION', () => {
    it('Tenant Beta cannot access Tenant Alpha products or orders', async () => {
      const betaList = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${adminTokenBeta}`);

      expect(betaList.status).toBe(200);
      expect(betaList.body.data.length).toBe(0); // Tenant Beta list empty
    });
  });
});
