import api from './axios';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    initialBalance: number | null;
    initialBalanceSetAt: string | null;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/v1/auth/logout');
  },

  me: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },
};

