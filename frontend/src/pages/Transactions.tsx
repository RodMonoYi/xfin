import { useEffect, useState } from 'react';
import { transactionsApi, Transaction, CreateTransactionData } from '../api/transactions';
import { categoriesApi, Category } from '../api/categories';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().min(0.01),
  date: z.string(),
  description: z.string().optional(),
  categoryId: z.string(),
  isImportant: z.boolean().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'PIX', 'BANK_TRANSFER', 'OTHER']).optional(),
  isInstallment: z.boolean().optional(),
  installmentsTotal: z.number().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        transactionsApi.list(filterType !== 'all' ? { type: filterType } : undefined),
        categoriesApi.list(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (editing) {
        await transactionsApi.update(editing.id, data);
      } else {
        await transactionsApi.create(data);
      }
      reset();
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditing(transaction);
    reset({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date.split('T')[0],
      description: transaction.description || '',
      categoryId: transaction.categoryId,
      isImportant: transaction.isImportant,
      paymentMethod: transaction.paymentMethod || undefined,
      isInstallment: transaction.isInstallment,
      installmentsTotal: transaction.installmentsTotal || undefined,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await transactionsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
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

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nova Transação
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('INCOME')}
            className={`px-4 py-2 rounded-lg ${filterType === 'INCOME' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('EXPENSE')}
            className={`px-4 py-2 rounded-lg ${filterType === 'EXPENSE' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Saídas
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transaction.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category.name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} Transação</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select {...register('type')} className="mt-1 block w-full border-gray-300 rounded-md">
                    <option value="INCOME">Entrada</option>
                    <option value="EXPENSE">Saída</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md"
                  />
                  {errors.amount && <p className="text-red-600 text-sm">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="mt-1 block w-full border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    {...register('description')}
                    className="mt-1 block w-full border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <select {...register('categoryId')} className="mt-1 block w-full border-gray-300 rounded-md">
                    <option value="">Selecione...</option>
                    {watchType === 'INCOME' 
                      ? incomeCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      : expenseCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                  </select>
                  {errors.categoryId && <p className="text-red-600 text-sm">{errors.categoryId.message}</p>}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md"
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

