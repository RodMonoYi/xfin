import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { receivablesApi, Receivable, CreateReceivableData } from '../api/receivables';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const receivableSchema = z.object({
  debtorName: z.string().min(1, 'Nome do devedor é obrigatório'),
  description: z.string().optional(),
  totalAmount: z.number().min(0.01),
  dueDate: z.string(),
});

type ReceivableFormData = z.infer<typeof receivableSchema>;

export const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Receivable | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await receivablesApi.list();
      setReceivables(data);
    } catch (error: any) {
      console.error('Erro ao carregar recebíveis:', error);
      toast.error('Erro ao carregar recebíveis. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ReceivableFormData) => {
    try {
      if (editing) {
        await receivablesApi.update(editing.id, data);
        toast.success('Recebível atualizado com sucesso!');
      } else {
        await receivablesApi.create(data);
        toast.success('Recebível criado com sucesso!');
      }
      reset();
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar recebível:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar recebível. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (receivable: Receivable) => {
    setEditing(receivable);
    reset({
      debtorName: receivable.debtorName,
      description: receivable.description || '',
      totalAmount: receivable.totalAmount,
      dueDate: receivable.dueDate.split('T')[0],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recebível?')) return;
    try {
      await receivablesApi.delete(id);
      toast.success('Recebível excluído com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir recebível:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir recebível. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await receivablesApi.markReceived(id);
      toast.success('Recebível marcado como recebido!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao marcar como recebido:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao marcar recebível como recebido. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">A Receber</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Novo Recebível
          </button>
        </div>

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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(receivable)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-900 text-sm border border-blue-600 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(receivable.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-900 text-sm border border-red-600 rounded"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => handleMarkReceived(receivable.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Marcar como Recebido
                    </button>
                  </div>
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

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Novo'} Recebível</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Devedor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('debtorName')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.debtorName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.debtorName && <p className="text-red-600 text-sm mt-1">{errors.debtorName.message}</p>}
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

