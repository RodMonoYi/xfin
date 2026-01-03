import { useEffect, useState } from 'react';
import { recurringApi, RecurringIncome, RecurringExpense, CreateRecurringData } from '../api/recurring';
import { Layout } from '../components/Layout';
import { formatCurrency } from '../utils/format';

export const Recurring: React.FC = () => {
  const [incomes, setIncomes] = useState<RecurringIncome[]>([]);
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incomes' | 'expenses'>('incomes');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incomesData, expensesData] = await Promise.all([
        recurringApi.incomes.list(),
        recurringApi.expenses.list(),
      ]);
      setIncomes(incomesData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncomes = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const projection = totalIncomes - totalExpenses;

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
        <h1 className="text-2xl font-bold text-gray-900">Fixos e Estimados</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Ganhos Fixos</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncomes)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Gastos Fixos</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className={`bg-white rounded-lg shadow p-4 ${projection >= 0 ? 'border-green-500 border-2' : 'border-red-500 border-2'}`}>
            <div className="text-sm text-gray-600">Projeção Mensal</div>
            <div className={`text-2xl font-bold ${projection >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(projection)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('incomes')}
                className={`flex-1 px-4 py-3 text-center font-medium ${
                  activeTab === 'incomes'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ganhos Fixos
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 px-4 py-3 text-center font-medium ${
                  activeTab === 'expenses'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Gastos Fixos
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'incomes' ? (
              <div className="space-y-4">
                {incomes.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{formatCurrency(Number(item.amount))}</div>
                      <div className="text-sm text-gray-500">
                        Dia {item.dayOfMonth} de cada mês
                        {item.endDate && ` até ${new Date(item.endDate).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{formatCurrency(Number(item.amount))}</div>
                      <div className="text-sm text-gray-500">
                        Dia {item.dayOfMonth} de cada mês
                        {item.endDate && ` até ${new Date(item.endDate).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

