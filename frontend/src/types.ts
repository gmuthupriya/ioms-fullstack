export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  username: string;
  role: UserRole;
  tenantId: string;
}

export interface DemoAccounts {
  tenantAlphaAdmin: { username: string; role: UserRole; tenantId: string; token: string };
  tenantAlphaUser: { username: string; role: UserRole; tenantId: string; token: string };
  tenantBetaAdmin: { username: string; role: UserRole; tenantId: string; token: string };
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  active: boolean;
  availableQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  tenantId: string;
  productId: string;
  availableQuantity: number;
  updatedAt: string;
  updatedBy: string;
}

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  productId: string;
  quantityChange: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  tenantId: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
    correlationId?: string;
  };
}
