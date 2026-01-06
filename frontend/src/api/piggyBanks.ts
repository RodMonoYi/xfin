import api from './axios';

export interface PiggyBank {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  currentAmount: number;
  targetAmount: number | null;
  amountPerPeriod: number;
  periodType: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH';
  userId: string;
  createdAt: string;
  updatedAt: string;
  transactions?: PiggyBankTransaction[];
}

export interface PiggyBankTransaction {
  id: string;
  piggyBankId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  description: string | null;
  createdAt: string;
}

export interface CreatePiggyBankData {
  name: string;
  description?: string | null;
  photoUrl?: string | null;
  targetAmount?: number | null;
  amountPerPeriod: number;
  periodType: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH';
}

export interface CreatePiggyBankFormData extends Omit<CreatePiggyBankData, 'photoUrl'> {
  photo?: File | null;
  photoUrl?: string | null;
}

export interface AddTransactionData {
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  description?: string;
}

export const piggyBanksApi = {
  list: async (): Promise<PiggyBank[]> => {
    const response = await api.get('/api/v1/piggy-banks');
    return response.data;
  },

  findById: async (id: string): Promise<PiggyBank> => {
    const response = await api.get(`/api/v1/piggy-banks/${id}`);
    return response.data;
  },

  create: async (data: CreatePiggyBankFormData): Promise<PiggyBank> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.targetAmount !== undefined && data.targetAmount !== null) {
      formData.append('targetAmount', data.targetAmount.toString());
    }
    formData.append('amountPerPeriod', data.amountPerPeriod.toString());
    formData.append('periodType', data.periodType);
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    console.log('Enviando FormData:', {
      name: data.name,
      hasPhoto: !!data.photo,
      photoName: data.photo?.name,
    });

    const response = await api.post('/api/v1/piggy-banks', formData);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePiggyBankFormData>): Promise<PiggyBank> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.targetAmount !== undefined && data.targetAmount !== null) {
      formData.append('targetAmount', data.targetAmount.toString());
    }
    if (data.amountPerPeriod) formData.append('amountPerPeriod', data.amountPerPeriod.toString());
    if (data.periodType) formData.append('periodType', data.periodType);
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    if (data.photoUrl) formData.append('photoUrl', data.photoUrl);

    console.log('Enviando FormData (update):', {
      name: data.name,
      hasPhoto: !!data.photo,
      photoName: data.photo?.name,
      photoUrl: data.photoUrl,
    });

    const response = await api.put(`/api/v1/piggy-banks/${id}`, formData);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/piggy-banks/${id}`);
  },

  addTransaction: async (id: string, data: AddTransactionData): Promise<PiggyBankTransaction> => {
    const response = await api.post(`/api/v1/piggy-banks/${id}/transactions`, data);
    return response.data;
  },

  getTransactions: async (id: string): Promise<PiggyBankTransaction[]> => {
    const response = await api.get(`/api/v1/piggy-banks/${id}/transactions`);
    return response.data;
  },
};

