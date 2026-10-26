import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import { ProductService } from './product.service.js';
import { createProductSchema, updateProductSchema, productListQuerySchema } from './product.schema.js';

export class ProductController {
  constructor(private readonly productService: ProductService = new ProductService()) {}

  createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.username;
      const input = createProductSchema.parse(req.body);
      const product = await this.productService.createProduct(tenantId, input, createdBy);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const input = updateProductSchema.parse(req.body);
      const product = await this.productService.updateProduct(id, tenantId, input);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const product = await this.productService.deactivateProduct(id, tenantId);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const product = await this.productService.getProductById(id, tenantId);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  listProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const query = productListQuerySchema.parse(req.query);
      const result = await this.productService.listProducts(tenantId, query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
