import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { InventoryService } from './inventory.service.js';
import { z } from 'zod';

const adjustInventorySchema = z.object({
  quantityChange: z.coerce.number().int('Quantity change must be an integer'),
  reason: z.string().optional().default('MANUAL_ADJUSTMENT'),
});

export class InventoryController {
  constructor(private readonly inventoryService: InventoryService = new InventoryService()) {}

  getInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id: productId } = req.params;
      const inventory = await this.inventoryService.getInventory(productId, tenantId);

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  };

  adjustInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.username;
      const { id: productId } = req.params;
      const body = adjustInventorySchema.parse(req.body);

      const inventory = await this.inventoryService.adjustInventory(
        productId,
        tenantId,
        body.quantityChange,
        body.reason,
        createdBy
      );

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id: productId } = req.params;
      const transactions = await this.inventoryService.getInventoryTransactions(productId, tenantId);

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  };
}
