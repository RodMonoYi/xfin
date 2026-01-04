import api from './axios';

export interface Debt {
  id: string;
  creditorName: string;
  description: string | null;
  totalAmount: number;
  isRecurring: boolean;
  recurrence: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  startDate: string;
  dueDate: string;
  paidAt: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'PAID' | 'OVERDUE';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtData {
  creditorName: string;
  description?: string;
  totalAmount: number;
  isRecurring?: boolean;
  recurrence?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  startDate: string;
  dueDate: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const debtsApi = {
  list: async (): Promise<Debt[]> => {
    const response = await api.get('/api/v1/debts');
    return response.data;
  },

  create: async (data: CreateDebtData): Promise<Debt> => {
    const response = await api.post('/api/v1/debts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateDebtData>): Promise<Debt> => {
    const response = await api.put(`/api/v1/debts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/debts/${id}`);
  },

  markPaid: async (id: string): Promise<Debt> => {
    const response = await api.patch(`/api/v1/debts/${id}/mark-paid`);
    return response.data;
  },

  unmarkPaid: async (id: string): Promise<Debt> => {
    const response = await api.patch(`/api/v1/debts/${id}/unmark-paid`);
    return response.data;
  },
};

