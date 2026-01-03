import api from './axios';

export interface SetInitialBalanceData {
  initialBalance: number;
}

export const onboardingApi = {
  setInitialBalance: async (data: SetInitialBalanceData) => {
    const response = await api.post('/api/v1/onboarding/initial-balance', data);
    return response.data;
  },
};

