import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { categoriesApi, Category, CreateCategoryData } from '../api/categories';
import { Layout } from '../components/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: 'EXPENSE',
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    try {
      const categoriesData = await categoriesApi.list();
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editing) {
        await categoriesApi.update(editing.id, data);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await categoriesApi.create(data);
        toast.success('Categoria criada com sucesso!');
      }
      reset({
        type: 'EXPENSE',
      });
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar categoria. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (category: Category) => {
    if (category.isDefault) {
      toast.error('Não é possível editar categorias padrão');
      return;
    }
    reset({
      name: category.name,
      type: category.type,
    });
    setEditing(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    if (category.isDefault) {
      toast.error('Não é possível excluir categorias padrão');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Categoria excluída com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir categoria. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
  };

  const handleNewCategory = () => {
    reset({
      name: '',
      type: 'EXPENSE',
    });
    setValue('type', 'EXPENSE');
    setShowModal(true);
  };

  const filteredCategories = filterType === 'all'
    ? categories
    : categories.filter(c => c.type === filterType);

  const customCategories = filteredCategories.filter(c => !c.isDefault);
  const defaultCategories = filteredCategories.filter(c => c.isDefault);

  const customExpenseCategories = customCategories.filter(c => c.type === 'EXPENSE');
  const customIncomeCategories = customCategories.filter(c => c.type === 'INCOME');
  const defaultExpenseCategories = defaultCategories.filter(c => c.type === 'EXPENSE');
  const defaultIncomeCategories = defaultCategories.filter(c => c.type === 'INCOME');

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gerenciar Categorias</h1>
          <button
            onClick={handleNewCategory}
            className="px-4 py-2 bg-blue-600 text-white dark:text-gray-100 dark:bg-gray-800 rounded-lg hover:bg-blue-700"
          >
            Nova Categoria
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-blue-600 text-white dark:text-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('INCOME')}
            className={`px-4 py-2 rounded-lg ${filterType === 'INCOME' ? 'bg-green-600 text-white dark:text-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('EXPENSE')}
            className={`px-4 py-2 rounded-lg ${filterType === 'EXPENSE' ? 'bg-red-600 text-white dark:text-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Saídas
          </button>
        </div>

        {/* Categorias Personalizadas - Saída */}
        {filterType === 'EXPENSE' || filterType === 'all' ? (
          customExpenseCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Suas Categorias de Saída</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customExpenseCategories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Saída
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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
            </div>
          )
        ) : null}

        {/* Categorias Personalizadas - Entrada */}
        {filterType === 'INCOME' || filterType === 'all' ? (
          customIncomeCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Suas Categorias de Entrada</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customIncomeCategories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Entrada
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
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
            </div>
          )
        ) : null}

        {/* Categorias Padrão - Saída */}
        {filterType === 'EXPENSE' || filterType === 'all' ? (
          defaultExpenseCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-gray-300">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Categorias Padrão de Saída</h2>
              <p className="text-sm text-gray-500 mb-4">Categorias pré-definidas do sistema (não podem ser editadas ou excluídas)</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {defaultExpenseCategories.map((category) => (
                      <tr key={category.id} className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">Padrão</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Saída
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className="text-gray-400">-</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : null}

        {/* Categorias Padrão - Entrada */}
        {filterType === 'INCOME' || filterType === 'all' ? (
          defaultIncomeCategories.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-gray-300">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Categorias Padrão de Entrada</h2>
              <p className="text-sm text-gray-500 mb-4">Categorias pré-definidas do sistema (não podem ser editadas ou excluídas)</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {defaultIncomeCategories.map((category) => (
                      <tr key={category.id} className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">Padrão</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Entrada
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className="text-gray-400">-</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : null}

        {/* Modal de Categoria */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {editing ? 'Editar' : 'Nova'} Categoria
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setValue('type', 'INCOME')}
                      className={`flex-1 py-2 px-4 border border-gray-300 rounded-l-md text-sm font-medium ${
                        watchType === 'INCOME' ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('type', 'EXPENSE')}
                      className={`flex-1 py-2 px-4 border border-gray-300 rounded-r-md text-sm font-medium ${
                        watchType === 'EXPENSE' ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Saída
                    </button>
                  </div>
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

