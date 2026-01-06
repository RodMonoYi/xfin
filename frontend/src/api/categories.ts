import api from './axios';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  userId: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const response = await api.get('/api/v1/categories');
    return response.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post('/api/v1/categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCategoryData>): Promise<Category> => {
    const response = await api.put(`/api/v1/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/categories/${id}`);
  },
};

