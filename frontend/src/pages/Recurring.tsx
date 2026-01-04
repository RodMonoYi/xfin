import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { recurringApi, RecurringIncome, RecurringExpense, CreateRecurringData } from '../api/recurring';
import { Layout } from '../components/Layout';
import { formatCurrency } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const recurringSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dayOfMonth: z.number().min(1, 'Dia do mês deve ser entre 1 e 31').max(31, 'Dia do mês deve ser entre 1 e 31'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

type RecurringFormData = z.infer<typeof recurringSchema>;

export const Recurring: React.FC = () => {
  const [incomes, setIncomes] = useState<RecurringIncome[]>([]);
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incomes' | 'expenses'>('incomes');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringIncome | RecurringExpense | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      active: true,
    },
  });

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
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RecurringFormData) => {
    try {
      if (editing) {
        if (activeTab === 'incomes') {
          await recurringApi.incomes.update(editing.id, data);
          toast.success('Ganho fixo atualizado com sucesso!');
        } else {
          await recurringApi.expenses.update(editing.id, data);
          toast.success('Gasto fixo atualizado com sucesso!');
        }
      } else {
        if (activeTab === 'incomes') {
          await recurringApi.incomes.create(data);
          toast.success('Ganho fixo criado com sucesso!');
        } else {
          await recurringApi.expenses.create(data);
          toast.success('Gasto fixo criado com sucesso!');
        }
      }
      reset();
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (item: RecurringIncome | RecurringExpense) => {
    setEditing(item);
    reset({
      name: item.name,
      amount: Number(item.amount),
      dayOfMonth: item.dayOfMonth,
      startDate: item.startDate.split('T')[0],
      endDate: item.endDate ? item.endDate.split('T')[0] : null,
      active: item.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      if (activeTab === 'incomes') {
        await recurringApi.incomes.delete(id);
        toast.success('Ganho fixo excluído com sucesso!');
      } else {
        await recurringApi.expenses.delete(id);
        toast.success('Gasto fixo excluído com sucesso!');
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Fixos e Estimados</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Novo {activeTab === 'incomes' ? 'Ganho Fixo' : 'Gasto Fixo'}
          </button>
        </div>

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
                {incomes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum ganho fixo cadastrado</div>
                ) : (
                  incomes.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(Number(item.amount))}</div>
                        <div className="text-sm text-gray-500">
                          Dia {item.dayOfMonth} de cada mês
                          {item.endDate && ` até ${new Date(item.endDate).toLocaleDateString('pt-BR')}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum gasto fixo cadastrado</div>
                ) : (
                  expenses.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(Number(item.amount))}</div>
                        <div className="text-sm text-gray-500">
                          Dia {item.dayOfMonth} de cada mês
                          {item.endDate && ` até ${new Date(item.endDate).toLocaleDateString('pt-BR')}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editing ? 'Editar' : 'Novo'} {activeTab === 'incomes' ? 'Ganho Fixo' : 'Gasto Fixo'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Ex: Salário, Assinatura Netflix"
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.amount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dia do Mês <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    {...register('dayOfMonth', { valueAsNumber: true })}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.dayOfMonth ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.dayOfMonth && <p className="text-red-600 text-sm mt-1">{errors.dayOfMonth.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.startDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Término (opcional)</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('active')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Ativo</label>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

