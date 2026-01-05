import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { piggyBanksApi, PiggyBank, PiggyBankTransaction, AddTransactionData, CreatePiggyBankFormData } from '../api/piggyBanks';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  description: z.string().optional(),
});

const piggyBankSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  photo: z.any().optional(),
  targetAmount: z.number().optional().nullable(),
  amountPerPeriod: z.number().min(0.01, 'Valor por período deve ser maior que zero'),
  periodType: z.enum(['DAY', 'WEEK', 'FORTNIGHT', 'MONTH']),
});

type TransactionFormData = z.infer<typeof transactionSchema>;
type PiggyBankFormData = z.infer<typeof piggyBankSchema>;

export const PiggyBankDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [piggyBank, setPiggyBank] = useState<PiggyBank | null>(null);
  const [transactions, setTransactions] = useState<PiggyBankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'DEPOSIT',
    },
  });

  const { register: registerPiggyBank, handleSubmit: handleSubmitPiggyBank, reset: resetPiggyBank, formState: { errors: errorsPiggyBank } } = useForm<PiggyBankFormData>({
    resolver: zodResolver(piggyBankSchema),
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [piggyBankData, transactionsData] = await Promise.all([
        piggyBanksApi.findById(id),
        piggyBanksApi.getTransactions(id),
      ]);
      setPiggyBank(piggyBankData);
      setTransactions(transactionsData);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da caixinha.');
      navigate('/piggy-banks');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitTransaction = async (data: TransactionFormData) => {
    if (!id) return;
    try {
      await piggyBanksApi.addTransaction(id, data);
      toast.success(data.type === 'DEPOSIT' ? 'Dinheiro adicionado com sucesso!' : 'Dinheiro retirado com sucesso!');
      reset();
      setShowTransactionModal(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao processar transação. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const onSubmitPiggyBank = async (data: PiggyBankFormData) => {
    if (!id || !piggyBank) return;
    try {
      const photoFile = photoInputRef.current?.files?.[0] || null;

      const formData: CreatePiggyBankFormData = {
        name: data.name,
        description: data.description || null,
        photo: photoFile,
        targetAmount: data.targetAmount || null,
        amountPerPeriod: data.amountPerPeriod,
        periodType: data.periodType,
      };

      if (piggyBank.photoUrl && !photoFile) {
        formData.photoUrl = piggyBank.photoUrl;
      }

      await piggyBanksApi.update(id, formData);
      toast.success('Caixinha atualizada com sucesso!');
      resetPiggyBank();
      setShowEditModal(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar caixinha:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao atualizar caixinha. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = () => {
    if (!piggyBank) return;
    resetPiggyBank({
      name: piggyBank.name,
      description: piggyBank.description || '',
      photo: null,
      targetAmount: piggyBank.targetAmount ? Number(piggyBank.targetAmount) : null,
      amountPerPeriod: Number(piggyBank.amountPerPeriod),
      periodType: piggyBank.periodType,
    });
    setShowEditModal(true);
  };

  const calculateEstimatedTime = (): string | null => {
    if (!piggyBank || !piggyBank.targetAmount) return null;
    
    const current = Number(piggyBank.currentAmount);
    const target = Number(piggyBank.targetAmount);
    const remaining = target - current;
    
    if (remaining <= 0) return 'Meta alcançada!';
    if (Number(piggyBank.amountPerPeriod) <= 0) return null;

    const amountPerPeriod = Number(piggyBank.amountPerPeriod);
    
    // Calcular períodos baseado no tipo
    let totalDays = 0;
    switch (piggyBank.periodType) {
      case 'DAY':
        totalDays = Math.ceil(remaining / amountPerPeriod);
        break;
      case 'WEEK':
        totalDays = Math.ceil(remaining / amountPerPeriod) * 7;
        break;
      case 'FORTNIGHT':
        totalDays = Math.ceil(remaining / amountPerPeriod) * 15;
        break;
      case 'MONTH':
        totalDays = Math.ceil(remaining / amountPerPeriod) * 30;
        break;
    }

    // Formatar no menor formato possível
    if (totalDays >= 30) {
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;
      if (remainingDays >= 7) {
        const weeks = Math.floor(remainingDays / 7);
        const days = remainingDays % 7;
        if (days > 0) {
          return `${months} ${months === 1 ? 'mês' : 'meses'}, ${weeks} ${weeks === 1 ? 'semana' : 'semanas'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
        }
        return `${months} ${months === 1 ? 'mês' : 'meses'} e ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      } else if (remainingDays > 0) {
        return `${months} ${months === 1 ? 'mês' : 'meses'} e ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`;
      }
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else if (totalDays >= 7) {
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      if (days > 0) {
        return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} e ${days} ${days === 1 ? 'dia' : 'dias'}`;
      }
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      return `${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`;
    }
  };

  const getPeriodLabel = (periodType: string): string => {
    const labels: Record<string, string> = {
      DAY: 'dia',
      WEEK: 'semana',
      FORTNIGHT: 'quinzena',
      MONTH: 'mês',
    };
    return labels[periodType] || periodType;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 dark:text-blue-400 transition-colors"></div>
        </div>
      </Layout>
    );
  }

  if (!piggyBank) {
    return (
      <Layout>
        <div className="text-center py-8 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg shadow p-8 hover:bg-gray-50 dark:hover:bg-gray-700">
          <p className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Caixinha não encontrada</p>
          <button
            onClick={() => navigate('/piggy-banks')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white dark:text-gray-100 dark:bg-gray-800 transition-colors hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  const progress = piggyBank.targetAmount 
    ? (Number(piggyBank.currentAmount) / Number(piggyBank.targetAmount)) * 100 
    : 0;
  const estimatedTime = calculateEstimatedTime();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/piggy-banks')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors  rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Voltar</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors hover:text-gray-900 dark:hover:text-gray-100">{piggyBank.name}</h1>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white dark:text-gray-100 dark:bg-gray-800 transition-colors hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Editar</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg shadow p-6">
          {piggyBank.photoUrl && (
            <div className="mb-6">
              <img
                src={`${apiUrl}${piggyBank.photoUrl}`}
                alt={piggyBank.name}
                className="w-full h-64 object-cover rounded-lg dark:border-gray-700 border-2 border-gray-300"
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', piggyBank.photoUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {piggyBank.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-2">Descrição</h3>
              <p className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">{piggyBank.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Valor Atual</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(Number(piggyBank.currentAmount))}
              </div>
            </div>

            {piggyBank.targetAmount && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Meta</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors hover:text-gray-900 dark:hover:text-gray-100">
                  {formatCurrency(Number(piggyBank.targetAmount))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Valor por Período</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors hover:text-gray-900 dark:hover:text-gray-100">
                {formatCurrency(Number(piggyBank.amountPerPeriod))} por {getPeriodLabel(piggyBank.periodType)}
              </div>
            </div>

            {estimatedTime && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Tempo Estimado para Meta</div>
                <div className="text-xl font-semibold text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-800 dark:hover:text-blue-200">
                  {estimatedTime}
                </div>
              </div>
            )}
          </div>

          {piggyBank.targetAmount && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Progresso</span>
                <span className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  {Math.min(progress, 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex-1 px-4 py-2 bg-green-600 text-white dark:text-gray-100  transition-colors hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-green-700"
            >
              Adicionar Dinheiro
            </button>
            <button
              onClick={() => {
                reset({ type: 'WITHDRAWAL', amount: 0, description: '' });
                setShowTransactionModal(true);
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retirar Dinheiro
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Histórico de Transações</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma transação registrada ainda.</p>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="py-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        transaction.type === 'DEPOSIT' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'DEPOSIT' ? 'Entrada' : 'Saída'}
                      </span>
                      <span className="font-semibold text-lg">
                        {transaction.type === 'DEPOSIT' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    {transaction.description && (
                      <div className="text-sm text-gray-600 mb-1">{transaction.description}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de editar caixinha */}
        {showEditModal && piggyBank && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Editar Caixinha</h2>
              <form onSubmit={handleSubmitPiggyBank(onSubmitPiggyBank)} className="space-y-4" encType="multipart/form-data">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerPiggyBank('name')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errorsPiggyBank.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errorsPiggyBank.name && <p className="text-red-600 text-sm mt-1">{errorsPiggyBank.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
                  <textarea
                    {...registerPiggyBank('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descreva sua caixinha..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Foto (opcional)</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    ref={(e) => {
                      photoInputRef.current = e;
                      registerPiggyBank('photo').ref(e);
                    }}
                    onChange={(e) => {
                      registerPiggyBank('photo').onChange(e);
                    }}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {piggyBank.photoUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Foto atual:</p>
                      <img
                        src={`${apiUrl}${piggyBank.photoUrl}`}
                        alt={piggyBank.name}
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Meta (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerPiggyBank('targetAmount', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 t focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 5000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor por Período <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerPiggyBank('amountPerPeriod', { valueAsNumber: true })}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errorsPiggyBank.amountPerPeriod ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errorsPiggyBank.amountPerPeriod && <p className="text-red-600 text-sm mt-1">{errorsPiggyBank.amountPerPeriod.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Período <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerPiggyBank('periodType')}
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DAY">Diário</option>
                    <option value="WEEK">Semanal</option>
                    <option value="FORTNIGHT">Quinzenal</option>
                    <option value="MONTH">Mensal</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetPiggyBank();
                      if (photoInputRef.current) {
                        photoInputRef.current.value = '';
                      }
                    }}
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

        {/* Modal de transação */}
        {showTransactionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {watch('type') === 'DEPOSIT' ? 'Adicionar' : 'Retirar'} Dinheiro
              </h2>
              <form onSubmit={handleSubmit(onSubmitTransaction)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('type', 'DEPOSIT')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        watch('type') === 'DEPOSIT'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Adicionar</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('type', 'WITHDRAWAL')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        watch('type') === 'WITHDRAWAL'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        <span>Retirar</span>
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
                  <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionModal(false);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Confirmar
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

