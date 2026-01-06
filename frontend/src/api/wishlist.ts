import api from './axios';

export type WishlistPriority = 'SUPERFLUO' | 'BAIXA' | 'MEDIA' | 'ALTA' | 'ESSENCIAL';

export interface WishlistItem {
  id: string;
  name: string;
  priority: WishlistPriority;
  estimatedPrice: number | null;
  utilityNote: string | null;
  targetDate: string | null;
  status: 'PLANNED' | 'BOUGHT' | 'DROPPED';
  photoUrl: string | null;
  purchaseLinks: string[] | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistItemFormData {
  name: string;
  priority: WishlistPriority;
  estimatedPrice?: number | null;
  utilityNote?: string | null;
  targetDate?: string | null;
  status?: 'PLANNED' | 'BOUGHT' | 'DROPPED';
  photo?: File | null;
  photoUrl?: string | null;
  purchaseLinks?: string[] | null;
}

export const wishlistApi = {
  list: async (): Promise<WishlistItem[]> => {
    const response = await api.get('/api/v1/wishlist');
    return response.data;
  },

  create: async (data: CreateWishlistItemFormData): Promise<WishlistItem> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('priority', data.priority);
    if (data.estimatedPrice !== undefined && data.estimatedPrice !== null) {
      formData.append('estimatedPrice', data.estimatedPrice.toString());
    }
    if (data.utilityNote) formData.append('utilityNote', data.utilityNote);
    if (data.targetDate) formData.append('targetDate', data.targetDate);
    if (data.status) formData.append('status', data.status);
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    if (data.purchaseLinks && data.purchaseLinks.length > 0) {
      formData.append('purchaseLinks', JSON.stringify(data.purchaseLinks));
    }

    const response = await api.post('/api/v1/wishlist', formData);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateWishlistItemFormData>): Promise<WishlistItem> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.priority) formData.append('priority', data.priority);
    if (data.estimatedPrice !== undefined) {
      formData.append('estimatedPrice', data.estimatedPrice?.toString() || '');
    }
    if (data.utilityNote !== undefined) formData.append('utilityNote', data.utilityNote || '');
    if (data.targetDate !== undefined) formData.append('targetDate', data.targetDate || '');
    if (data.status) formData.append('status', data.status);
    if (data.photo) {
      formData.append('photo', data.photo);
    } else if (data.photoUrl !== undefined) {
      formData.append('photoUrl', data.photoUrl || '');
    }
    if (data.purchaseLinks !== undefined) {
      formData.append('purchaseLinks', data.purchaseLinks ? JSON.stringify(data.purchaseLinks) : '');
    }

    const response = await api.put(`/api/v1/wishlist/${id}`, formData);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/wishlist/${id}`);
  },
};

