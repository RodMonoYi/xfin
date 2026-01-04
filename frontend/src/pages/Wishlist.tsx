import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { wishlistApi, WishlistItem, CreateWishlistItemData } from '../api/wishlist';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const wishlistSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  priority: z.number().min(1).max(5),
  estimatedPrice: z.number().optional().nullable(),
  utilityNote: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'BOUGHT', 'DROPPED']).optional(),
});

type WishlistFormData = z.infer<typeof wishlistSchema>;

export const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WishlistFormData>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      priority: 3,
      status: 'PLANNED',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await wishlistApi.list();
      setItems(data);
    } catch (error: any) {
      console.error('Erro ao carregar lista de desejos:', error);
      toast.error('Erro ao carregar lista de desejos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WishlistFormData) => {
    try {
      if (editing) {
        await wishlistApi.update(editing.id, data);
        toast.success('Item atualizado com sucesso!');
      } else {
        await wishlistApi.create(data);
        toast.success('Item criado com sucesso!');
      }
      reset();
      setShowModal(false);
      setEditing(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar item. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditing(item);
    reset({
      name: item.name,
      priority: item.priority,
      estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : null,
      utilityNote: item.utilityNote || '',
      targetDate: item.targetDate ? item.targetDate.split('T')[0] : null,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await wishlistApi.delete(id);
      toast.success('Item excluído com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir item:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir item. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
  };

  const plannedItems = items.filter(i => i.status === 'PLANNED');
  const boughtItems = items.filter(i => i.status === 'BOUGHT');
  const totalEstimated = plannedItems.reduce((sum, item) => sum + (Number(item.estimatedPrice) || 0), 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Lista de Desejos</h1>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-600">Total Estimado</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(totalEstimated)}</div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Novo Item
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Planejados</h2>
          </div>
          <div className="divide-y">
            {plannedItems.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.utilityNote && <div className="text-sm text-gray-500">{item.utilityNote}</div>}
                  {item.targetDate && (
                    <div className="text-sm text-gray-500">
                      Meta: {formatDate(item.targetDate)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {item.estimatedPrice && (
                      <div className="font-bold text-gray-900">{formatCurrency(item.estimatedPrice)}</div>
                    )}
                    <div className="text-xs text-gray-500">Prioridade: {item.priority}/5</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-900 text-sm border border-blue-600 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 text-red-600 hover:text-red-900 text-sm border border-red-600 rounded"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {boughtItems.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Comprados</h2>
            </div>
            <div className="divide-y">
              {boughtItems.map((item) => (
                <div key={item.id} className="p-4 flex justify-between items-center opacity-60">
                  <div className="font-medium line-through">{item.name}</div>
                  {item.estimatedPrice && (
                    <div className="font-bold text-gray-600">{formatCurrency(item.estimatedPrice)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Editar' : 'Novo'} Item</h2>
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
                    Prioridade (1-5) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    {...register('priority', { valueAsNumber: true })}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.priority ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {errors.priority && <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço Estimado</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('estimatedPrice', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
                    className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nota de Utilidade</label>
                  <textarea
                    {...register('utilityNote')}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data Meta</label>
                  <input
                    type="date"
                    {...register('targetDate')}
                    className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register('status')} className="mt-1 block w-full border-gray-300 rounded-md px-3 py-2 border">
                    <option value="PLANNED">Planejado</option>
                    <option value="BOUGHT">Comprado</option>
                    <option value="DROPPED">Desistido</option>
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

