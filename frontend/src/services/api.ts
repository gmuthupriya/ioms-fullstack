import axios from 'axios';
import { ApiResponse, Product, Inventory, Order, Payment, InventoryTransaction, DemoAccounts } from '../types.js';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  const tenantId = localStorage.getItem('tenant_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

export const authService = {
  getDemoAccounts: async (): Promise<DemoAccounts> => {
    const res = await api.get<ApiResponse<DemoAccounts>>('/auth/demo-accounts');
    return res.data.data;
  },
  login: async (username: string, role: string, tenantId: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: any }>>('/auth/login', { username, role, tenantId });
    return res.data.data;
  },
};

export const productService = {
  list: async (params?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }) => {
    const res = await api.get<ApiResponse<Product[]>>('/products', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },
  create: async (data: { name: string; sku: string; description?: string; price: number; initialQuantity?: number }) => {
    const res = await api.post<ApiResponse<Product>>('/products', data);
    return res.data.data;
  },
  update: async (id: string, data: { name?: string; description?: string; price?: number; active?: boolean }) => {
    const res = await api.patch<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data;
  },
  deactivate: async (id: string) => {
    const res = await api.delete<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },
};

export const inventoryService = {
  getInventory: async (productId: string) => {
    const res = await api.get<ApiResponse<Inventory>>(`/products/${productId}/inventory`);
    return res.data.data;
  },
  adjust: async (productId: string, quantityChange: number, reason?: string) => {
    const res = await api.post<ApiResponse<Inventory>>(`/products/${productId}/inventory/adjust`, {
      quantityChange,
      reason,
    });
    return res.data.data;
  },
  getTransactions: async (productId: string) => {
    const res = await api.get<ApiResponse<InventoryTransaction[]>>(`/products/${productId}/inventory/transactions`);
    return res.data.data;
  },
};

export const orderService = {
  create: async (items: Array<{ productId: string; quantity: number }>) => {
    const res = await api.post<ApiResponse<Order>>('/orders', { items });
    return res.data.data;
  },
  list: async (params?: { page?: number; limit?: number; status?: string; paymentStatus?: string }) => {
    const res = await api.get<ApiResponse<Order[]>>('/orders', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return res.data.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return res.data.data;
  },
};

export const paymentService = {
  create: async (orderId: string, paymentMethod: string = 'CARD'): Promise<Payment> => {
    const res = await api.post<ApiResponse<Payment>>('/payments', { orderId, paymentMethod });
    return res.data.data;
  },
  getById: async (paymentId: string): Promise<Payment> => {
    const res = await api.get<ApiResponse<Payment>>(`/payments/${paymentId}`);
    return res.data.data;
  },
  getByOrderId: async (orderId: string): Promise<Payment> => {
    const res = await api.get<ApiResponse<Payment>>(`/payments/order/${orderId}`);
    return res.data.data;
  },
  process: async (paymentId: string, result: 'SUCCESS' | 'FAILED' | 'CANCELLED'): Promise<{ payment: Payment; orderStatus: string }> => {
    const res = await api.post<ApiResponse<{ payment: Payment; orderStatus: string }>>(`/payments/${paymentId}/process`, { result });
    return res.data.data;
  },
};
