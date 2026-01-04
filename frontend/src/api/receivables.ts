import api from './axios';

export interface Receivable {
  id: string;
  debtorName: string;
  description: string | null;
  totalAmount: number;
  dueDate: string;
  receivedAt: string | null;
  status: 'OPEN' | 'RECEIVED' | 'OVERDUE';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceivableData {
  debtorName: string;
  description?: string;
  totalAmount: number;
  dueDate: string;
}

export const receivablesApi = {
  list: async (): Promise<Receivable[]> => {
    const response = await api.get('/api/v1/receivables');
    return response.data;
  },

  create: async (data: CreateReceivableData): Promise<Receivable> => {
    const response = await api.post('/api/v1/receivables', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateReceivableData>): Promise<Receivable> => {
    const response = await api.put(`/api/v1/receivables/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/receivables/${id}`);
  },

  markReceived: async (id: string): Promise<Receivable> => {
    const response = await api.patch(`/api/v1/receivables/${id}/mark-received`);
    return response.data;
  },

  unmarkReceived: async (id: string): Promise<Receivable> => {
    const response = await api.patch(`/api/v1/receivables/${id}/unmark-received`);
    return response.data;
  },
};

