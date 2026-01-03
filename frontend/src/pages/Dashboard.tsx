import { useEffect, useState } from 'react';
import { dashboardApi, DashboardSummary } from '../api/dashboard';
import { Layout } from '../components/Layout';
import { formatCurrency } from '../utils/format';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar resumo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      </Layout>
    );
  }

  if (!summary) return null;

  const evolutionColor = summary.balanceEvolution >= 0 ? 'text-green-600' : 'text-red-600';
  const projectionColor = summary.monthProjection >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Saldo Atual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Saldo Atual</h2>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {formatCurrency(summary.currentBalance)}
          </div>
          <div className={`text-sm ${evolutionColor}`}>
            {summary.balanceEvolution >= 0 ? '+' : ''}
            {formatCurrency(summary.balanceEvolution)} desde o início
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total de Entradas</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total de Saídas</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Dívidas Abertas</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalDebts)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">A Receber</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalReceivables)}</div>
          </div>
        </div>

        {/* Mês Atual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Mês Atual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Entradas</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(summary.monthIncome)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Saídas</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(summary.monthExpense)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Projeção do Mês</div>
              <div className={`text-xl font-bold ${projectionColor}`}>
                {formatCurrency(summary.monthProjection)}
              </div>
            </div>
          </div>
        </div>

        {/* Fixos e Estimados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Fixos e Estimados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Ganhos Fixos</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(summary.totalRecurringIncome)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Gastos Fixos</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(summary.totalRecurringExpense)}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {(summary.pendingDebts.length > 0 || summary.pendingReceivables.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.pendingDebts.length > 0 && (
              <div className="bg-orange-50 rounded-lg shadow p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-4">Dívidas Pendentes</h3>
                <div className="space-y-2">
                  {summary.pendingDebts.slice(0, 5).map((debt: any) => (
                    <div key={debt.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{debt.creditorName}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(debt.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="font-semibold text-orange-600">
                        {formatCurrency(debt.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.pendingReceivables.length > 0 && (
              <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Valores a Receber</h3>
                <div className="space-y-2">
                  {summary.pendingReceivables.slice(0, 5).map((receivable: any) => (
                    <div key={receivable.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{receivable.debtorName}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(receivable.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(receivable.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

