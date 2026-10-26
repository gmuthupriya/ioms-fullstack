import { prisma } from '../../db/client.js';

export interface InventoryData {
  id: string;
  tenantId: string;
  productId: string;
  availableQuantity: number;
  updatedAt: Date;
  updatedBy: string;
}

export interface InventoryTransactionData {
  id: string;
  tenantId: string;
  productId: string;
  quantityChange: number;
  reason: string;
  createdBy: string;
  createdAt: Date;
}

const memoryInventories: InventoryData[] = [];
const memoryTransactions: InventoryTransactionData[] = [];

export class InventoryRepository {
  private isMemoryMode(): boolean {
    return process.env.USE_MEMORY_DB === 'true';
  }

  async getInventoryByProductId(productId: string, tenantId: string): Promise<InventoryData | null> {
    if (this.isMemoryMode()) {
      const inv = memoryInventories.find((i) => i.productId === productId && i.tenantId === tenantId);
      if (inv) return inv;

      const { ProductRepository } = await import('../products/product.repository.js');
      const prod = await new ProductRepository().findById(productId, tenantId);
      if (prod) {
        return {
          id: `inv_${productId}`,
          tenantId,
          productId,
          availableQuantity: prod.availableQuantity ?? 0,
          updatedAt: new Date(),
          updatedBy: 'system',
        };
      }
      return null;
    }
    try {
      const inventory = await prisma.inventory.findFirst({
        where: { productId, tenantId },
      });
      if (!inventory) return null;
      return {
        id: inventory.id,
        tenantId: inventory.tenantId,
        productId: inventory.productId,
        availableQuantity: inventory.availableQuantity,
        updatedAt: inventory.updatedAt,
        updatedBy: inventory.updatedBy,
      };
    } catch {
      return memoryInventories.find((inv) => inv.productId === productId && inv.tenantId === tenantId) || null;
    }
  }

  async adjustQuantity(data: {
    tenantId: string;
    productId: string;
    quantityChange: number;
    reason: string;
    createdBy: string;
  }): Promise<InventoryData> {
    if (this.isMemoryMode()) {
      let inv = memoryInventories.find((i) => i.productId === data.productId && i.tenantId === data.tenantId);
      if (!inv) {
        const { ProductRepository } = await import('../products/product.repository.js');
        const prod = await new ProductRepository().findById(data.productId, data.tenantId);
        inv = {
          id: `inv_${Math.random().toString(36).substring(2, 9)}`,
          tenantId: data.tenantId,
          productId: data.productId,
          availableQuantity: prod?.availableQuantity ?? 0,
          updatedAt: new Date(),
          updatedBy: data.createdBy,
        };
        memoryInventories.push(inv);
      }

      const newQty = inv.availableQuantity + data.quantityChange;
      if (newQty < 0) {
        throw new Error(`Insufficient inventory: Cannot reduce below 0. Current: ${inv.availableQuantity}`);
      }

      inv.availableQuantity = newQty;
      inv.updatedAt = new Date();
      inv.updatedBy = data.createdBy;

      memoryTransactions.push({
        id: `tx_${Math.random().toString(36).substring(2, 9)}`,
        tenantId: data.tenantId,
        productId: data.productId,
        quantityChange: data.quantityChange,
        reason: data.reason,
        createdBy: data.createdBy,
        createdAt: new Date(),
      });

      return inv;
    }

    try {
      return await prisma.$transaction(async (tx) => {
        let inv = await tx.inventory.findFirst({
          where: { productId: data.productId, tenantId: data.tenantId },
        });

        if (!inv) {
          inv = await tx.inventory.create({
            data: {
              tenantId: data.tenantId,
              productId: data.productId,
              availableQuantity: 0,
              updatedBy: data.createdBy,
            },
          });
        }

        const newQty = inv.availableQuantity + data.quantityChange;
        if (newQty < 0) {
          throw new Error(`Insufficient inventory: Cannot reduce below 0. Current: ${inv.availableQuantity}`);
        }

        const updated = await tx.inventory.update({
          where: { id: inv.id },
          data: {
            availableQuantity: newQty,
            updatedBy: data.createdBy,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId: data.tenantId,
            productId: data.productId,
            quantityChange: data.quantityChange,
            reason: data.reason,
            createdBy: data.createdBy,
          },
        });

        return {
          id: updated.id,
          tenantId: updated.tenantId,
          productId: updated.productId,
          availableQuantity: updated.availableQuantity,
          updatedAt: updated.updatedAt,
          updatedBy: updated.updatedBy,
        };
      });
    } catch (err: any) {
      if (err.message.includes('Insufficient inventory')) {
        throw err;
      }
      let inv = memoryInventories.find((i) => i.productId === data.productId && i.tenantId === data.tenantId);
      if (!inv) {
        inv = {
          id: `inv_${Math.random().toString(36).substring(2, 9)}`,
          tenantId: data.tenantId,
          productId: data.productId,
          availableQuantity: 0,
          updatedAt: new Date(),
          updatedBy: data.createdBy,
        };
        memoryInventories.push(inv);
      }

      const newQty = inv.availableQuantity + data.quantityChange;
      if (newQty < 0) {
        throw new Error(`Insufficient inventory: Cannot reduce below 0. Current: ${inv.availableQuantity}`);
      }

      inv.availableQuantity = newQty;
      inv.updatedAt = new Date();
      inv.updatedBy = data.createdBy;
      return inv;
    }
  }

  async getTransactions(productId: string, tenantId: string): Promise<InventoryTransactionData[]> {
    if (this.isMemoryMode()) {
      return memoryTransactions.filter((t) => t.productId === productId && t.tenantId === tenantId);
    }
    try {
      const items = await prisma.inventoryTransaction.findMany({
        where: { productId, tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return items.map((t) => ({
        id: t.id,
        tenantId: t.tenantId,
        productId: t.productId,
        quantityChange: t.quantityChange,
        reason: t.reason,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
      }));
    } catch {
      return memoryTransactions.filter((t) => t.productId === productId && t.tenantId === tenantId);
    }
  }
}
