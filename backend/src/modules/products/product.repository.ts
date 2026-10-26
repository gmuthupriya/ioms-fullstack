import { prisma } from '../../db/client.js';

export interface ProductData {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  active: boolean;
  availableQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Storage Fallback for Testing / Offline Runs
const memoryProducts: ProductData[] = [
  {
    id: 'prod_101',
    tenantId: 'tenant-alpha',
    name: 'Ergonomic Mechanical Keyboard',
    sku: 'KB-MECH-PRO',
    description: 'RGB Mechanical Keyboard with custom tactile switches & aluminum frame.',
    price: 149.99,
    active: true,
    availableQuantity: 35,
    createdAt: new Date(Date.now() - 7 * 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'prod_102',
    tenantId: 'tenant-alpha',
    name: 'Noise-Cancelling Wireless Headphones',
    sku: 'AUD-NC-HEADSET',
    description: 'Active noise cancellation, 30-hour battery life & premium audio fidelity.',
    price: 249.50,
    active: true,
    availableQuantity: 18,
    createdAt: new Date(Date.now() - 6 * 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'prod_103',
    tenantId: 'tenant-alpha',
    name: 'Ultra-Wide 34-inch Curved Monitor',
    sku: 'DISP-34-UW',
    description: '144Hz WQHD IPS display for high productivity and immersive visuals.',
    price: 699.00,
    active: true,
    availableQuantity: 8,
    createdAt: new Date(Date.now() - 5 * 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'prod_104',
    tenantId: 'tenant-alpha',
    name: 'Ergonomic Executive Office Chair',
    sku: 'CHR-ERG-MAX',
    description: 'Adjustable lumbar support, breathable mesh, 4D armrests for all-day comfort.',
    price: 389.00,
    active: true,
    availableQuantity: 12,
    createdAt: new Date(Date.now() - 4 * 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'prod_105',
    tenantId: 'tenant-alpha',
    name: 'Smart Watch Pro Series 7',
    sku: 'WCH-SMART-S7',
    description: 'Health tracking, OLED touch display, GPS & heart rate monitor.',
    price: 299.99,
    active: true,
    availableQuantity: 25,
    createdAt: new Date(Date.now() - 3 * 86400000),
    updatedAt: new Date(),
  },
  {
    id: 'prod_106',
    tenantId: 'tenant-alpha',
    name: 'Thunderbolt 4 Docking Station',
    sku: 'DOCK-TB4-100',
    description: 'Dual 4K display output, 90W power delivery, 10Gbps transfer speed.',
    price: 189.95,
    active: true,
    availableQuantity: 4,
    createdAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(),
  },
];

export class ProductRepository {
  private isMemoryMode(): boolean {
    return process.env.USE_MEMORY_DB === 'true';
  }

  async findById(id: string, tenantId: string): Promise<ProductData | null> {
    if (this.isMemoryMode()) {
      return memoryProducts.find((p) => p.id === id && p.tenantId === tenantId) || null;
    }
    try {
      const product = await prisma.product.findFirst({
        where: { id, tenantId },
        include: { inventory: true },
      });
      if (!product) return null;
      return {
        id: product.id,
        tenantId: product.tenantId,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: Number(product.price),
        active: product.active,
        availableQuantity: product.inventory?.availableQuantity ?? 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch {
      return memoryProducts.find((p) => p.id === id && p.tenantId === tenantId) || null;
    }
  }

  async findBySku(sku: string, tenantId: string): Promise<ProductData | null> {
    if (this.isMemoryMode()) {
      return memoryProducts.find((p) => p.sku === sku && p.tenantId === tenantId) || null;
    }
    try {
      const product = await prisma.product.findFirst({
        where: { sku, tenantId },
      });
      if (!product) return null;
      return {
        id: product.id,
        tenantId: product.tenantId,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: Number(product.price),
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch {
      return memoryProducts.find((p) => p.sku === sku && p.tenantId === tenantId) || null;
    }
  }

  async create(data: {
    tenantId: string;
    name: string;
    sku: string;
    description?: string;
    price: number;
    active: boolean;
    initialQuantity?: number;
    createdBy: string;
  }): Promise<ProductData> {
    if (this.isMemoryMode()) {
      const newProduct: ProductData = {
        id: `prod_${Math.random().toString(36).substring(2, 9)}`,
        tenantId: data.tenantId,
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        active: data.active,
        availableQuantity: data.initialQuantity || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryProducts.push(newProduct);
      return newProduct;
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            tenantId: data.tenantId,
            name: data.name,
            sku: data.sku,
            description: data.description,
            price: data.price,
            active: data.active,
          },
        });

        const inventory = await tx.inventory.create({
          data: {
            tenantId: data.tenantId,
            productId: product.id,
            availableQuantity: data.initialQuantity || 0,
            updatedBy: data.createdBy,
          },
        });

        if (data.initialQuantity && data.initialQuantity > 0) {
          await tx.inventoryTransaction.create({
            data: {
              tenantId: data.tenantId,
              productId: product.id,
              quantityChange: data.initialQuantity,
              reason: 'INITIAL_STOCK',
              createdBy: data.createdBy,
            },
          });
        }

        return {
          id: product.id,
          tenantId: product.tenantId,
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: Number(product.price),
          active: product.active,
          availableQuantity: inventory.availableQuantity,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      });
      return result;
    } catch {
      const newProduct: ProductData = {
        id: `prod_${Math.random().toString(36).substring(2, 9)}`,
        tenantId: data.tenantId,
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        active: data.active,
        availableQuantity: data.initialQuantity || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryProducts.push(newProduct);
      return newProduct;
    }
  }

  async update(id: string, tenantId: string, data: Partial<ProductData>): Promise<ProductData | null> {
    if (this.isMemoryMode()) {
      const idx = memoryProducts.findIndex((p) => p.id === id && p.tenantId === tenantId);
      if (idx === -1) return null;
      memoryProducts[idx] = { ...memoryProducts[idx], ...data, updatedAt: new Date() };
      return memoryProducts[idx];
    }
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          active: data.active,
        },
      });
      return {
        id: product.id,
        tenantId: product.tenantId,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: Number(product.price),
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch {
      const idx = memoryProducts.findIndex((p) => p.id === id && p.tenantId === tenantId);
      if (idx === -1) return null;
      memoryProducts[idx] = { ...memoryProducts[idx], ...data, updatedAt: new Date() };
      return memoryProducts[idx];
    }
  }

  async list(tenantId: string, options: { page: number; limit: number; search?: string; activeOnly?: boolean }) {
    if (this.isMemoryMode()) {
      let filtered = memoryProducts.filter((p) => p.tenantId === tenantId);
      if (options.activeOnly) filtered = filtered.filter((p) => p.active);
      if (options.search) {
        const s = options.search.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      const start = (options.page - 1) * options.limit;
      return {
        items: filtered.slice(start, start + options.limit),
        total: filtered.length,
      };
    }

    try {
      const where: any = { tenantId };
      if (options.activeOnly) where.active = true;
      if (options.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { sku: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { inventory: true },
          skip: (options.page - 1) * options.limit,
          take: options.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      return {
        items: items.map((p) => ({
          id: p.id,
          tenantId: p.tenantId,
          name: p.name,
          sku: p.sku,
          description: p.description,
          price: Number(p.price),
          active: p.active,
          availableQuantity: p.inventory?.availableQuantity ?? 0,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        total,
      };
    } catch {
      let filtered = memoryProducts.filter((p) => p.tenantId === tenantId);
      if (options.activeOnly) filtered = filtered.filter((p) => p.active);
      if (options.search) {
        const s = options.search.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      const start = (options.page - 1) * options.limit;
      return {
        items: filtered.slice(start, start + options.limit),
        total: filtered.length,
      };
    }
  }
}
