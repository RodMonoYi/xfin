import { useEffect, useState } from 'react';
import { receivablesApi, Receivable, CreateReceivableData } from '../api/receivables';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';

export const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await receivablesApi.list();
      setReceivables(data);
    } catch (error) {
      console.error('Erro ao carregar recebíveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await receivablesApi.markReceived(id);
      loadData();
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error);
    }
  };

  const openReceivables = receivables.filter(r => r.status !== 'RECEIVED');
  const receivedReceivables = receivables.filter(r => r.status === 'RECEIVED');

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
        <h1 className="text-2xl font-bold text-gray-900">A Receber</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recebíveis Abertos</h2>
          </div>
          <div className="divide-y">
            {openReceivables.map((receivable) => (
              <div key={receivable.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{receivable.debtorName}</div>
                  <div className="text-sm text-gray-500">{receivable.description}</div>
                  <div className="text-sm text-gray-500">Vencimento: {formatDate(receivable.dueDate)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{formatCurrency(receivable.totalAmount)}</div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      receivable.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {receivable.status === 'OVERDUE' ? 'Vencido' : 'Aberto'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkReceived(receivable.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Marcar como Recebido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {receivedReceivables.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Recebíveis Recebidos</h2>
            </div>
            <div className="divide-y">
              {receivedReceivables.map((receivable) => (
                <div key={receivable.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{receivable.debtorName}</div>
                    <div className="text-sm text-gray-500">{receivable.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-600">{formatCurrency(receivable.totalAmount)}</div>
                    <div className="text-xs text-gray-500">Recebido em {formatDate(receivable.receivedAt!)}</div>
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

