import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { piggyBanksApi, PiggyBank, PiggyBankTransaction, CreatePiggyBankFormData, AddTransactionData } from '../api/piggyBanks';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const piggyBankSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  photo: z.any().optional().nullable(),
  targetAmount: z.number().min(0.01).optional().nullable(),
  amountPerPeriod: z.number().min(0.01, 'Valor por período deve ser maior que zero'),
  periodType: z.enum(['DAY', 'WEEK', 'FORTNIGHT', 'MONTH']),
});

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  description: z.string().optional(),
});

type PiggyBankFormData = z.infer<typeof piggyBankSchema>;
type TransactionFormData = z.infer<typeof transactionSchema>;

export const PiggyBanks: React.FC = () => {
  const navigate = useNavigate();
  const [piggyBanks, setPiggyBanks] = useState<PiggyBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editing, setEditing] = useState<PiggyBank | null>(null);
  const [selectedPiggyBank, setSelectedPiggyBank] = useState<PiggyBank | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const { register: registerPiggyBank, handleSubmit: handleSubmitPiggyBank, reset: resetPiggyBank, watch: watchPiggyBank, getValues, formState: { errors: errorsPiggyBank } } = useForm<PiggyBankFormData>({
    resolver: zodResolver(piggyBankSchema),
  });

  const { register: registerTransaction, handleSubmit: handleSubmitTransaction, reset: resetTransaction, watch: watchTransaction, setValue: setValueTransaction, formState: { errors: errorsTransaction } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'DEPOSIT',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await piggyBanksApi.list();
      setPiggyBanks(data);
    } catch (error: any) {
      console.error('Erro ao carregar caixinhas:', error);
      toast.error('Erro ao carregar caixinhas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPiggyBank = async (data: PiggyBankFormData) => {
    try {
      // Capturar o arquivo diretamente do input file
      const photoFile = photoInputRef.current?.files?.[0] || null;

      console.log('Arquivo capturado:', photoFile);
      console.log('Dados do formulário:', data);

      const formData: CreatePiggyBankFormData = {
        name: data.name,
        description: data.description || null,
        photo: photoFile,
        targetAmount: data.targetAmount || null,
        amountPerPeriod: data.amountPerPeriod,
        periodType: data.periodType,
      };

      if (editing) {
        await piggyBanksApi.update(editing.id, {
          ...formData,
          photoUrl: editing.photoUrl,
        });
        toast.success('Caixinha atualizada com sucesso!');
      } else {
        await piggyBanksApi.create(formData);
        toast.success('Caixinha criada com sucesso!');
      }
      resetPiggyBank();
      setShowModal(false);
      setEditing(null);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar caixinha:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar caixinha. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const onSubmitTransaction = async (data: TransactionFormData) => {
    if (!selectedPiggyBank) return;
    try {
      await piggyBanksApi.addTransaction(selectedPiggyBank.id, data);
      toast.success(data.type === 'DEPOSIT' ? 'Dinheiro adicionado com sucesso!' : 'Dinheiro retirado com sucesso!');
      resetTransaction();
      setShowTransactionModal(false);
      setSelectedPiggyBank(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao processar transação. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (piggyBank: PiggyBank) => {
    setEditing(piggyBank);
    resetPiggyBank({
      name: piggyBank.name,
      description: piggyBank.description || '',
      photo: null,
      targetAmount: piggyBank.targetAmount ? Number(piggyBank.targetAmount) : null,
      amountPerPeriod: Number(piggyBank.amountPerPeriod),
      periodType: piggyBank.periodType,
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta caixinha?')) return;
    try {
      await piggyBanksApi.delete(id);
      toast.success('Caixinha excluída com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir caixinha:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir caixinha. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleAddTransaction = (piggyBank: PiggyBank) => {
    setSelectedPiggyBank(piggyBank);
    resetTransaction({ type: 'DEPOSIT', amount: 0, description: '' });
    setShowTransactionModal(true);
  };

  const handleViewDetails = (piggyBank: PiggyBank) => {
    navigate(`/piggy-banks/${piggyBank.id}`);
    setOpenMenuId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const calculateEstimatedTime = (piggyBank: PiggyBank): string | null => {
    if (!piggyBank.targetAmount) return null;
    
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

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    resetPiggyBank();
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedPiggyBank(null);
    resetTransaction();
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Caixinhas</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nova Caixinha
          </button>
        </div>

        {piggyBanks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Nenhuma caixinha cadastrada ainda.</p>
            <p className="text-sm text-gray-400 mt-2">Crie sua primeira caixinha para começar a guardar dinheiro!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {piggyBanks.map((piggyBank) => {
              const progress = piggyBank.targetAmount 
                ? (Number(piggyBank.currentAmount) / Number(piggyBank.targetAmount)) * 100 
                : 0;
              const estimatedTime = calculateEstimatedTime(piggyBank);

              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

              return (
                <div 
                  key={piggyBank.id} 
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleViewDetails(piggyBank)}
                >
                  {piggyBank.photoUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={`${apiUrl}${piggyBank.photoUrl}`}
                        alt={piggyBank.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', e);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{piggyBank.name}</h3>
                      <div className="relative" ref={(el) => (menuRefs.current[piggyBank.id] = el)}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === piggyBank.id ? null : piggyBank.id);
                          }}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === piggyBank.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(piggyBank);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Ver Detalhes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(piggyBank);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(piggyBank.id);
                                setOpenMenuId(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {piggyBank.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{piggyBank.description}</p>
                    )}

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Valor Atual</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(Number(piggyBank.currentAmount))}
                        </div>
                      </div>

                      {piggyBank.targetAmount && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Meta</span>
                            <span className="text-gray-600">
                              {formatCurrency(Number(piggyBank.currentAmount))} / {formatCurrency(Number(piggyBank.targetAmount))}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          {estimatedTime && (
                            <div className="text-xs text-gray-500 mt-1">{estimatedTime}</div>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{formatCurrency(Number(piggyBank.amountPerPeriod))}</span>
                        {' '}por {getPeriodLabel(piggyBank.periodType)}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTransaction(piggyBank);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Adicionar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(piggyBank);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de criar/editar caixinha */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editing ? 'Editar' : 'Nova'} Caixinha
              </h2>
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
                  {editing && editing.photoUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Foto atual:</p>
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${editing.photoUrl}`}
                        alt={editing.name}
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
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Modal de adicionar/remover dinheiro */}
        {showTransactionModal && selectedPiggyBank && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedPiggyBank.name}
              </h2>
              <form onSubmit={handleSubmitTransaction(onSubmitTransaction)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setValueTransaction('type', 'DEPOSIT')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        watchTransaction('type') === 'DEPOSIT'
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
                      onClick={() => setValueTransaction('type', 'WITHDRAWAL')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        watchTransaction('type') === 'WITHDRAWAL'
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
                  <input type="hidden" {...registerTransaction('type')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerTransaction('amount', { valueAsNumber: true })}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errorsTransaction.amount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errorsTransaction.amount && <p className="text-red-600 text-sm mt-1">{errorsTransaction.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
                  <textarea
                    {...registerTransaction('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseTransactionModal}
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

