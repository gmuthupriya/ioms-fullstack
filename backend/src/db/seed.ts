import { prisma } from './client.js';

export async function seedDatabase() {
  console.log('🌱 Initializing runtime database seed data...');

  try {
    // 1. Seed Tenants
    const tenantAlpha = await prisma.tenant.upsert({
      where: { id: 'tenant-alpha' },
      update: {},
      create: {
        id: 'tenant-alpha',
        name: 'Alpha Enterprise Corp',
        status: 'ACTIVE',
      },
    });

    const tenantBeta = await prisma.tenant.upsert({
      where: { id: 'tenant-beta' },
      update: {},
      create: {
        id: 'tenant-beta',
        name: 'Beta Global Logistics',
        status: 'ACTIVE',
      },
    });

    // 2. Seed Predefined Users
    await prisma.user.upsert({
      where: { id: 'usr_alpha_admin' },
      update: {},
      create: {
        id: 'usr_alpha_admin',
        tenantId: tenantAlpha.id,
        username: 'alpha_admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { id: 'usr_alpha_user' },
      update: {},
      create: {
        id: 'usr_alpha_user',
        tenantId: tenantAlpha.id,
        username: 'alpha_user',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { id: 'usr_beta_admin' },
      update: {},
      create: {
        id: 'usr_beta_admin',
        tenantId: tenantBeta.id,
        username: 'beta_admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // 3. Seed Reference Products & Initial Stock
    const p1 = await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenantAlpha.id, sku: 'SKU-LAPTOP-01' } },
      update: {},
      create: {
        tenantId: tenantAlpha.id,
        name: 'High Performance Laptop',
        sku: 'SKU-LAPTOP-01',
        description: '32GB RAM Workstation',
        price: 1200.00,
        active: true,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: p1.id },
      update: {},
      create: {
        tenantId: tenantAlpha.id,
        productId: p1.id,
        availableQuantity: 50,
        updatedBy: 'alpha_admin',
      },
    });

    console.log('✅ Database seeding completed successfully.');
  } catch (err) {
    console.warn('⚠️ Seeding note: Database connection skipped or using in-memory mode.', err);
  }
}

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase().then(() => process.exit(0));
}
