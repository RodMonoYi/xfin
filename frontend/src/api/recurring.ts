import api from './axios';

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringData {
  name: string;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
}

export const recurringApi = {
  incomes: {
    list: async (): Promise<RecurringIncome[]> => {
      const response = await api.get('/api/v1/recurring-incomes');
      return response.data;
    },

    create: async (data: CreateRecurringData): Promise<RecurringIncome> => {
      const response = await api.post('/api/v1/recurring-incomes', data);
      return response.data;
    },

    update: async (id: string, data: Partial<CreateRecurringData>): Promise<RecurringIncome> => {
      const response = await api.put(`/api/v1/recurring-incomes/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/api/v1/recurring-incomes/${id}`);
    },
  },

  expenses: {
    list: async (): Promise<RecurringExpense[]> => {
      const response = await api.get('/api/v1/recurring-expenses');
      return response.data;
    },

    create: async (data: CreateRecurringData): Promise<RecurringExpense> => {
      const response = await api.post('/api/v1/recurring-expenses', data);
      return response.data;
    },

    update: async (id: string, data: Partial<CreateRecurringData>): Promise<RecurringExpense> => {
      const response = await api.put(`/api/v1/recurring-expenses/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/api/v1/recurring-expenses/${id}`);
    },
  },
};

