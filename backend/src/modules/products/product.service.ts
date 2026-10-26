import { ProductRepository, ProductData } from './product.repository.js';
import { CreateProductInput, UpdateProductInput, ProductListQueryInput } from './product.schema.js';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error.js';

export class ProductService {
  constructor(private readonly productRepository: ProductRepository = new ProductRepository()) {}

  async createProduct(tenantId: string, input: CreateProductInput, createdBy: string): Promise<ProductData> {
    const existing = await this.productRepository.findBySku(input.sku, tenantId);
    if (existing) {
      throw new ConflictError(`Product SKU '${input.sku}' already exists within tenant ${tenantId}`);
    }

    return this.productRepository.create({
      tenantId,
      name: input.name,
      sku: input.sku,
      description: input.description,
      price: input.price,
      active: input.active ?? true,
      initialQuantity: input.initialQuantity || 0,
      createdBy,
    });
  }

  async updateProduct(id: string, tenantId: string, input: UpdateProductInput): Promise<ProductData> {
    const existing = await this.productRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found in tenant ${tenantId}`);
    }

    const updated = await this.productRepository.update(id, tenantId, input);
    return updated!;
  }

  async deactivateProduct(id: string, tenantId: string): Promise<ProductData> {
    const existing = await this.productRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError(`Product with ID ${id} not found in tenant ${tenantId}`);
    }

    const updated = await this.productRepository.update(id, tenantId, { active: false });
    return updated!;
  }

  async getProductById(id: string, tenantId: string): Promise<ProductData> {
    const product = await this.productRepository.findById(id, tenantId);
    if (!product) {
      throw new NotFoundError(`Product with ID ${id} not found in tenant ${tenantId}`);
    }
    return product;
  }

  async listProducts(tenantId: string, query: ProductListQueryInput) {
    return this.productRepository.list(tenantId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      activeOnly: query.activeOnly === 'true',
    });
  }
}
