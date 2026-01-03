import api from './axios';

export interface DashboardSummary {
  currentBalance: number;
  initialBalance: number;
  balanceEvolution: number;
  totalIncome: number;
  totalExpenses: number;
  totalDebts: number;
  totalReceivables: number;
  monthIncome: number;
  monthExpense: number;
  monthProjection: number;
  totalRecurringIncome: number;
  totalRecurringExpense: number;
  pendingDebts: any[];
  pendingReceivables: any[];
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/api/v1/dashboard/summary');
    return response.data;
  },
};

