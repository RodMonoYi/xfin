import { useEffect, useState } from 'react';
import { debtsApi, Debt, CreateDebtData } from '../api/debts';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';

export const Debts: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await debtsApi.list();
      setDebts(data);
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await debtsApi.markPaid(id);
      loadData();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const openDebts = debts.filter(d => d.status !== 'PAID');
  const paidDebts = debts.filter(d => d.status === 'PAID');

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dívidas</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Dívidas Abertas</h2>
          </div>
          <div className="divide-y">
            {openDebts.map((debt) => (
              <div key={debt.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{debt.creditorName}</div>
                  <div className="text-sm text-gray-500">{debt.description}</div>
                  <div className="text-sm text-gray-500">Vencimento: {formatDate(debt.dueDate)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-orange-600">{formatCurrency(debt.totalAmount)}</div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      debt.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {debt.status === 'OVERDUE' ? 'Vencida' : 'Aberta'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkPaid(debt.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Marcar como Paga
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {paidDebts.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Dívidas Pagas</h2>
            </div>
            <div className="divide-y">
              {paidDebts.map((debt) => (
                <div key={debt.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{debt.creditorName}</div>
                    <div className="text-sm text-gray-500">{debt.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-600">{formatCurrency(debt.totalAmount)}</div>
                    <div className="text-xs text-gray-500">Paga em {formatDate(debt.paidAt!)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

