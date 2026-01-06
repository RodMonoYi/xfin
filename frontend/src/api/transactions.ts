import api from './axios';

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string | null;
  categoryId: string;
  userId: string;
  isImportant: boolean;
  paymentMethod: 'CASH' | 'CARD' | 'PIX' | 'BANK_TRANSFER' | 'OTHER' | null;
  isInstallment: boolean;
  installmentsTotal: number | null;
  installmentIndex: number | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
  };
}

export interface CreateTransactionData {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description?: string;
  categoryId: string;
  isImportant?: boolean;
  paymentMethod?: 'CASH' | 'CARD' | 'PIX' | 'BANK_TRANSFER' | 'OTHER';
  isInstallment?: boolean;
  installmentsTotal?: number;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE';
  isImportant?: boolean;
}

export const transactionsApi = {
  list: async (filters?: TransactionFilters): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isImportant !== undefined) params.append('isImportant', String(filters.isImportant));

    const response = await api.get(`/api/v1/transactions?${params.toString()}`);
    return response.data;
  },

  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await api.post('/api/v1/transactions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTransactionData>): Promise<Transaction> => {
    const response = await api.put(`/api/v1/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/transactions/${id}`);
  },
};

