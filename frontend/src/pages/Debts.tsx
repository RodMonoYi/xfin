import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { debtsApi, Debt, CreateDebtData } from '../api/debts';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const debtSchema = z.object({
  creditorName: z.string().min(1, 'Nome do credor é obrigatório'),
  description: z.string().optional(),
  totalAmount: z.number().min(0.01),
  isRecurring: z.boolean().optional(),
  recurrence: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional().nullable(),
  startDate: z.string(),
  dueDate: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

type DebtFormData = z.infer<typeof debtSchema>;

export const Debts: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      isRecurring: false,
      priority: 'MEDIUM',
    },
  });

  const isRecurring = watch('isRecurring');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await debtsApi.list();
      setDebts(data);
    } catch (error: any) {
      console.error('Erro ao carregar dívidas:', error);
      toast.error('Erro ao carregar dívidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: DebtFormData) => {
    try {
      if (editing) {
        await debtsApi.update(editing.id, data);
        toast.success('Dívida atualizada com sucesso!');
      } else {
        await debtsApi.create(data);
        toast.success('Dívida criada com sucesso!');
      }
      reset();
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar dívida:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar dívida. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditing(debt);
    reset({
      creditorName: debt.creditorName,
      description: debt.description || '',
      totalAmount: debt.totalAmount,
      isRecurring: debt.isRecurring,
      recurrence: debt.recurrence,
      startDate: debt.startDate.split('T')[0],
      dueDate: debt.dueDate.split('T')[0],
      priority: debt.priority,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta dívida?')) return;
    try {
      await debtsApi.delete(id);
      toast.success('Dívida excluída com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir dívida:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir dívida. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await debtsApi.markPaid(id);
      toast.success('Dívida marcada como paga!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao marcar como paga:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao marcar dívida como paga. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dívidas</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nova Dívida
          </button>
        </div>

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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(debt)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-900 text-sm border border-blue-600 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-900 text-sm border border-red-600 rounded"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => handleMarkPaid(debt.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Marcar como Paga
                    </button>
                  </div>
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

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} Dívida</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Credor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('creditorName')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.creditorName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.creditorName && <p className="text-red-600 text-sm mt-1">{errors.creditorName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor Total <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('totalAmount', { valueAsNumber: true })}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.totalAmount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.totalAmount && <p className="text-red-600 text-sm mt-1">{errors.totalAmount.message}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isRecurring')}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">É recorrente?</label>
                </div>

                {isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recorrência</label>
                    <select {...register('recurrence')} className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border">
                      <option value="">Selecione...</option>
                      <option value="MONTHLY">Mensal</option>
                      <option value="QUARTERLY">Trimestral</option>
                      <option value="YEARLY">Anual</option>
                    </select>
                  </div>
                )}

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
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Vencimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.dueDate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.dueDate && <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <select {...register('priority')} className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border">
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
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

