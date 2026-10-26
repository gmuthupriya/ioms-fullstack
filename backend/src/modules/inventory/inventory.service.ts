import { InventoryRepository, InventoryData, InventoryTransactionData } from './inventory.repository.js';
import { ProductRepository } from '../products/product.repository.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/app-error.js';

export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository = new InventoryRepository(),
    private readonly productRepository: ProductRepository = new ProductRepository()
  ) {}

  async getInventory(productId: string, tenantId: string): Promise<InventoryData> {
    const product = await this.productRepository.findById(productId, tenantId);
    if (!product) {
      throw new NotFoundError(`Product ${productId} not found in tenant ${tenantId}`);
    }

    const inventory = await this.inventoryRepository.getInventoryByProductId(productId, tenantId);
    if (!inventory) {
      return {
        id: 'inv_default',
        tenantId,
        productId,
        availableQuantity: 0,
        updatedAt: new Date(),
        updatedBy: 'system',
      };
    }
    return inventory;
  }

  async adjustInventory(
    productId: string,
    tenantId: string,
    quantityChange: number,
    reason: string,
    createdBy: string
  ): Promise<InventoryData> {
    const product = await this.productRepository.findById(productId, tenantId);
    if (!product) {
      throw new NotFoundError(`Product ${productId} not found in tenant ${tenantId}`);
    }

    try {
      return await this.inventoryRepository.adjustQuantity({
        tenantId,
        productId,
        quantityChange,
        reason: reason || 'MANUAL_ADJUSTMENT',
        createdBy,
      });
    } catch (err: any) {
      if (err.message.includes('Insufficient inventory')) {
        throw new BadRequestError(err.message);
      }
      throw err;
    }
  }

  async getInventoryTransactions(productId: string, tenantId: string): Promise<InventoryTransactionData[]> {
    const product = await this.productRepository.findById(productId, tenantId);
    if (!product) {
      throw new NotFoundError(`Product ${productId} not found in tenant ${tenantId}`);
    }
    return this.inventoryRepository.getTransactions(productId, tenantId);
  }
}
