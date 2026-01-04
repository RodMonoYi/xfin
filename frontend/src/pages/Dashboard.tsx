import { useEffect, useState } from 'react';
import { dashboardApi, DashboardSummary } from '../api/dashboard';
import { Layout } from '../components/Layout';
import { formatCurrency } from '../utils/format';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceExpanded, setBalanceExpanded] = useState(true);
  const [valuesVisible, setValuesVisible] = useState(true);

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
  
  // Calcular balanço completo: saldo atual - dívidas abertas + recebíveis abertos
  const completeBalance = summary.currentBalance - summary.totalDebts + summary.totalReceivables;
  const completeBalanceColor = completeBalance >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header com botão de privacidade */}
        <div className="flex justify-end">
          <button
            onClick={() => setValuesVisible(!valuesVisible)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title={valuesVisible ? 'Ocultar todos os valores' : 'Mostrar todos os valores'}
          >
            {valuesVisible ? (
              <>
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Ocultar Valores</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Mostrar Valores</span>
              </>
            )}
          </button>
        </div>

        {/* Saldo Atual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Saldo Atual</h2>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {valuesVisible ? formatCurrency(summary.currentBalance) : 'R$ ••••••'}
          </div>
          <div className={`text-sm ${evolutionColor}`}>
            {valuesVisible ? (
              <>
                {summary.balanceEvolution >= 0 ? '+' : ''}
                {formatCurrency(summary.balanceEvolution)} desde o início
              </>
            ) : (
              'R$ •••••• desde o início'
            )}
          </div>
        </div>

        {/* Balanço Completo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg border border-blue-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Balanço Completo</h2>
              <button
                onClick={() => setBalanceExpanded(!balanceExpanded)}
                className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                title={balanceExpanded ? 'Recolher' : 'Expandir'}
              >
                <svg 
                  className={`w-5 h-5 text-blue-600 transition-transform ${balanceExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className={`text-4xl font-bold mb-4 ${completeBalanceColor}`}>
              {valuesVisible ? formatCurrency(completeBalance) : 'R$ ••••••'}
            </div>
            {balanceExpanded && (
              <div className="text-sm text-gray-600 space-y-1 animate-fadeIn">
                <div className="flex justify-between">
                  <span>Saldo Atual:</span>
                  <span className="font-medium">
                    {valuesVisible ? formatCurrency(summary.currentBalance) : 'R$ ••••••'}
                  </span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>- Dívidas em Aberto:</span>
                  <span className="font-medium">
                    {valuesVisible ? formatCurrency(summary.totalDebts) : 'R$ ••••••'}
                  </span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>+ A Receber:</span>
                  <span className="font-medium">
                    {valuesVisible ? formatCurrency(summary.totalReceivables) : 'R$ ••••••'}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-300 flex justify-between font-semibold">
                  <span>Balanço Final:</span>
                  <span className={completeBalanceColor}>
                    {valuesVisible ? formatCurrency(completeBalance) : 'R$ ••••••'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total de Entradas</div>
            <div className="text-2xl font-bold text-green-600">
              {valuesVisible ? formatCurrency(summary.totalIncome) : 'R$ ••••••'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total de Saídas</div>
            <div className="text-2xl font-bold text-red-600">
              {valuesVisible ? formatCurrency(summary.totalExpenses) : 'R$ ••••••'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Dívidas Abertas</div>
            <div className="text-2xl font-bold text-orange-600">
              {valuesVisible ? formatCurrency(summary.totalDebts) : 'R$ ••••••'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">A Receber</div>
            <div className="text-2xl font-bold text-blue-600">
              {valuesVisible ? formatCurrency(summary.totalReceivables) : 'R$ ••••••'}
            </div>
          </div>
        </div>

        {/* Mês Atual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Mês Atual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Entradas</div>
              <div className="text-xl font-bold text-green-600">
                {valuesVisible ? formatCurrency(summary.monthIncome) : 'R$ ••••••'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Saídas</div>
              <div className="text-xl font-bold text-red-600">
                {valuesVisible ? formatCurrency(summary.monthExpense) : 'R$ ••••••'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Projeção do Mês</div>
              <div className={`text-xl font-bold ${projectionColor}`}>
                {valuesVisible ? formatCurrency(summary.monthProjection) : 'R$ ••••••'}
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
                {valuesVisible ? formatCurrency(summary.totalRecurringIncome) : 'R$ ••••••'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Gastos Fixos</div>
              <div className="text-xl font-bold text-red-600">
                {valuesVisible ? formatCurrency(summary.totalRecurringExpense) : 'R$ ••••••'}
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
                        {valuesVisible ? formatCurrency(debt.totalAmount) : 'R$ ••••••'}
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
                        {valuesVisible ? formatCurrency(receivable.totalAmount) : 'R$ ••••••'}
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

