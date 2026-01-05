import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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

interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

type SortField = 'date' | 'createdAt' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';
type DateRange = 'all' | '7days' | '30days' | 'custom';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    loadData();
  }, []);

  const getDateFilters = () => {
    const filters: { startDate?: string; endDate?: string } = {};
    
    if (dateRange === 'all') {
      return filters;
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (dateRange === '7days') {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      filters.startDate = startDate.toISOString().split('T')[0];
      filters.endDate = today.toISOString().split('T')[0];
    } else if (dateRange === '30days') {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      filters.startDate = startDate.toISOString().split('T')[0];
      filters.endDate = today.toISOString().split('T')[0];
    } else if (dateRange === 'custom') {
      if (customStartDate) {
        filters.startDate = customStartDate;
      }
      if (customEndDate) {
        filters.endDate = customEndDate;
      }
    }
    
    return filters;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const dateFilters = getDateFilters();
      const typeFilter = filterType !== 'all' ? { type: filterType } : {};
      const filters = { ...dateFilters, ...typeFilter };
      
      const [transactionsData, categoriesData] = await Promise.all([
        transactionsApi.list(filters),
        categoriesApi.list(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar transações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, dateRange, customStartDate, customEndDate]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (editing) {
        await transactionsApi.update(editing.id, data);
        toast.success('Transação atualizada com sucesso!');
      } else {
        await transactionsApi.create(data);
        toast.success('Transação criada com sucesso!');
      }
      reset({
        type: 'EXPENSE',
      });
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar transação. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
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

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      toast.error('Não é possível editar categorias padrão');
      return;
    }
    setEditingCategory(category);
    resetCategory({
      name: category.name,
      type: category.type,
    });
    setShowCategoryModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await transactionsApi.delete(id);
      toast.success('Transação excluída com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir transação. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
  };

  const handleNewTransaction = () => {
    const defaultType = filterType === 'INCOME' ? 'INCOME' : filterType === 'EXPENSE' ? 'EXPENSE' : 'EXPENSE';
    reset({
      type: defaultType,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: '',
    });
    setValue('type', defaultType);
    setShowModal(true);
  };

  // Calcular gastos por categoria
  const calculateCategoryExpenses = (): CategoryExpense[] => {
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
    const categoryMap = new Map<string, { name: string; total: number }>();

    expenseTransactions.forEach(transaction => {
      const categoryId = transaction.categoryId;
      const categoryName = transaction.category.name;
      const current = categoryMap.get(categoryId) || { name: categoryName, total: 0 };
      // Garantir que o valor seja convertido para número (pode vir como string do backend)
      const amount = typeof transaction.amount === 'number' 
        ? transaction.amount 
        : parseFloat(String(transaction.amount)) || 0;
      if (!isNaN(amount)) {
        current.total += amount;
      }
      categoryMap.set(categoryId, current);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, cat) => {
      const catTotal = typeof cat.total === 'number' ? cat.total : parseFloat(String(cat.total)) || 0;
      return sum + catTotal;
    }, 0);
    
    return Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        total: data.total,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const categoryExpenses = calculateCategoryExpenses();

  // Paginação
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Função para ordenar transações
  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'amount':
        aValue = typeof a.amount === 'number' ? a.amount : parseFloat(String(a.amount)) || 0;
        bValue = typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount)) || 0;
        break;
      case 'category':
        aValue = a.category.name.toLowerCase();
        bValue = b.category.name.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Aplicar paginação após ordenação
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
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

  const getButtonText = () => {
    if (filterType === 'INCOME') return 'Nova Entrada';
    if (filterType === 'EXPENSE') return 'Nova Saída';
    return 'Nova Transação';
  };

  const getButtonColor = () => {
    if (filterType === 'INCOME') return 'bg-green-600 hover:bg-green-700';
    if (filterType === 'EXPENSE') return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transações</h1>
          <button
            onClick={handleNewTransaction}
            className={`px-4 py-2 text-white rounded-lg ${getButtonColor()}`}
          >
            {getButtonText()}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
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

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Data Inicial</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Data Final</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de Gastos por Categoria */}
        {filterType === 'EXPENSE' || filterType === 'all' ? (
          categoryExpenses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Gastos por Categoria</h2>
              <div className="space-y-4">
                {categoryExpenses.map((item) => (
                  <div key={item.categoryId}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.categoryName}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.total)} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-600 h-3 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : null}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Data da Transação
                    {getSortIcon('date')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Data de Registro
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-2">
                    Categoria
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-2">
                    Valor
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {sortedTransactions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-100">
                Mostrando {startIndex + 1} a {Math.min(endIndex, sortedTransactions.length)} de {sortedTransactions.length} transações
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
                <option value="100">100 por página</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border-gray-300 dark:border-gray-700'
                }`}
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded border ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                Próxima
              </button>
            </div>
          </div>
        )}

        {/* Modal de Transação */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Nova'} Transação</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('type', 'INCOME')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        watchType === 'INCOME'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Entrada</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('type', 'EXPENSE')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        watchType === 'EXPENSE'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        <span>Saída</span>
                      </div>
                    </button>
                  </div>
                  <input type="hidden" {...register('type')} />
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
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.date ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    type="text"
                    {...register('description')}
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select 
                    {...register('categoryId')} 
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.categoryId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {watchType === 'INCOME' 
                      ? incomeCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      : expenseCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                  </select>
                  {errors.categoryId && <p className="text-red-600 text-sm mt-1">{errors.categoryId.message}</p>}
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
