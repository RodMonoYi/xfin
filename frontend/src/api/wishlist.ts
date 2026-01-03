import api from './axios';

export interface WishlistItem {
  id: string;
  name: string;
  priority: number;
  estimatedPrice: number | null;
  utilityNote: string | null;
  targetDate: string | null;
  status: 'PLANNED' | 'BOUGHT' | 'DROPPED';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistItemData {
  name: string;
  priority: number;
  estimatedPrice?: number | null;
  utilityNote?: string | null;
  targetDate?: string | null;
  status?: 'PLANNED' | 'BOUGHT' | 'DROPPED';
}

export const wishlistApi = {
  list: async (): Promise<WishlistItem[]> => {
    const response = await api.get('/api/v1/wishlist');
    return response.data;
  },

  create: async (data: CreateWishlistItemData): Promise<WishlistItem> => {
    const response = await api.post('/api/v1/wishlist', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateWishlistItemData>): Promise<WishlistItem> => {
    const response = await api.put(`/api/v1/wishlist/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/wishlist/${id}`);
  },
};

