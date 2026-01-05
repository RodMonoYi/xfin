import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { receivablesApi, Receivable, CreateReceivableData } from '../api/receivables';
import { categoriesApi, Category } from '../api/categories';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const receivableSchema = z.object({
  debtorName: z.string().min(1, 'Nome do devedor é obrigatório'),
  description: z.string().optional(),
  totalAmount: z.number().min(0.01),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  categoryId: z.string().optional().nullable(),
});

type ReceivableFormData = z.infer<typeof receivableSchema>;

export const Receivables: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Receivable | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'markReceived' | 'unmarkReceived' | 'delete' | null;
    receivable?: Receivable;
  }>({ show: false, type: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReceivableFormData>({
    resolver: zodResolver(receivableSchema),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [receivablesData, categoriesData] = await Promise.all([
        receivablesApi.list(),
        categoriesApi.list(),
      ]);
      setReceivables(receivablesData);
      setCategories(categoriesData);
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
        if (editing.status === 'RECEIVED') {
          toast.error('Não é possível editar um recebível que já foi recebido. Reabra o recebível primeiro.');
          return;
        }
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
    if (receivable.status === 'RECEIVED') {
      toast.error('Não é possível editar um recebível que já foi recebido. Reabra o recebível primeiro.');
      return;
    }
    setEditing(receivable);
    reset({
      debtorName: receivable.debtorName,
      description: receivable.description || '',
      totalAmount: receivable.totalAmount,
      dueDate: receivable.dueDate.split('T')[0],
      categoryId: receivable.categoryId || null,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (!receivable) return;
    setConfirmModal({ show: true, type: 'delete', receivable });
  };

  const confirmDelete = async () => {
    if (!confirmModal.receivable) return;
    try {
      await receivablesApi.delete(confirmModal.receivable.id);
      toast.success('Recebível excluído com sucesso!');
      setConfirmModal({ show: false, type: null });
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir recebível:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir recebível. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleMarkReceived = (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (!receivable) return;
    setConfirmModal({ show: true, type: 'markReceived', receivable });
  };

  const confirmMarkReceived = async () => {
    if (!confirmModal.receivable) return;
    try {
      await receivablesApi.markReceived(confirmModal.receivable.id);
      toast.success('Recebível marcado como recebido!');
      setConfirmModal({ show: false, type: null });
      loadData();
    } catch (error: any) {
      console.error('Erro ao marcar como recebido:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao marcar recebível como recebido. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleUnmarkReceived = (id: string) => {
    const receivable = receivables.find(r => r.id === id);
    if (!receivable) return;
    setConfirmModal({ show: true, type: 'unmarkReceived', receivable });
  };

  const confirmUnmarkReceived = async () => {
    if (!confirmModal.receivable) return;
    try {
      await receivablesApi.unmarkReceived(confirmModal.receivable.id);
      toast.success('Recebível reaberto com sucesso!');
      setConfirmModal({ show: false, type: null });
      loadData();
    } catch (error: any) {
      console.error('Erro ao reabrir recebível:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao reabrir recebível. Tente novamente.';
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
                      disabled={receivable.status === 'RECEIVED'}
                      className={`px-3 py-1 text-sm border rounded ${
                        receivable.status === 'RECEIVED'
                          ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-900 border-blue-600'
                      }`}
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
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-600">{formatCurrency(receivable.totalAmount)}</div>
                      <div className="text-xs text-gray-500">Recebido em {formatDate(receivable.receivedAt!)}</div>
                    </div>
                    <button
                      onClick={() => handleUnmarkReceived(receivable.id)}
                      className="px-3 py-1 text-orange-600 hover:text-orange-900 text-sm border border-orange-600 rounded"
                      title="Reabrir recebível"
                    >
                      Reabrir
                    </button>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria (para quando lançar como transação)
                  </label>
                  <select 
                    {...register('categoryId')} 
                    className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border"
                  >
                    <option value="">Não especificado</option>
                    {categories
                      .filter(c => c.type === 'INCOME')
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
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

        {/* Modal de Confirmação */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmModal.type === 'markReceived'
                    ? 'bg-green-100'
                    : confirmModal.type === 'unmarkReceived'
                    ? 'bg-orange-100'
                    : 'bg-red-100'
                }`}>
                  {confirmModal.type === 'markReceived' ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : confirmModal.type === 'unmarkReceived' ? (
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">
                  {confirmModal.type === 'markReceived' && 'Confirmar Recebimento'}
                  {confirmModal.type === 'unmarkReceived' && 'Reabrir Recebível'}
                  {confirmModal.type === 'delete' && 'Confirmar Exclusão'}
                </h3>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  {confirmModal.type === 'markReceived' && confirmModal.receivable && (
                    <>Tem certeza que deseja marcar o recebível de <strong>{confirmModal.receivable.debtorName}</strong> no valor de <strong>{formatCurrency(confirmModal.receivable.totalAmount)}</strong> como recebido?</>
                  )}
                  {confirmModal.type === 'unmarkReceived' && confirmModal.receivable && (
                    <>Tem certeza que deseja reabrir o recebível de <strong>{confirmModal.receivable.debtorName}</strong>?</>
                  )}
                  {confirmModal.type === 'delete' && confirmModal.receivable && (
                    <>Tem certeza que deseja excluir o recebível de <strong>{confirmModal.receivable.debtorName}</strong>? Esta ação não pode ser desfeita.</>
                  )}
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ show: false, type: null })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.type === 'markReceived') confirmMarkReceived();
                    else if (confirmModal.type === 'unmarkReceived') confirmUnmarkReceived();
                    else if (confirmModal.type === 'delete') confirmDelete();
                  }}
                  className={`px-4 py-2 rounded-md text-white ${
                    confirmModal.type === 'markReceived'
                      ? 'bg-green-600 hover:bg-green-700'
                      : confirmModal.type === 'unmarkReceived'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmModal.type === 'markReceived' && 'Confirmar Recebimento'}
                  {confirmModal.type === 'unmarkReceived' && 'Reabrir'}
                  {confirmModal.type === 'delete' && 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

