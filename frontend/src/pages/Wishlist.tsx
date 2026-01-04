import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { wishlistApi, WishlistItem, CreateWishlistItemFormData, WishlistPriority } from '../api/wishlist';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const wishlistSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  priority: z.enum(['SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL']),
  estimatedPrice: z.number().optional().nullable(),
  utilityNote: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'BOUGHT', 'DROPPED']).optional(),
  photo: z.any().optional().nullable(),
  purchaseLinks: z.array(z.string()).optional().nullable(),
}).refine((data) => {
  // Validar URLs apenas se houver links não vazios
  if (data.purchaseLinks && data.purchaseLinks.length > 0) {
    return data.purchaseLinks.every(link => {
      if (!link || link.trim() === '') return true; // Links vazios são permitidos
      try {
        new URL(link);
        return true;
      } catch {
        return false;
      }
    });
  }
  return true;
}, {
  message: 'Um ou mais links são inválidos',
  path: ['purchaseLinks'],
});

type WishlistFormData = z.infer<typeof wishlistSchema>;

const priorityConfig: Record<WishlistPriority, { label: string; color: string; bgColor: string }> = {
  SUPERFLUO: { label: 'Superfluo', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  BAIXA: { label: 'Baixa', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  MEDIA: { label: 'Média', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  ALTA: { label: 'Alta', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ESSENCIAL: { label: 'Essencial', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [purchaseLinks, setPurchaseLinks] = useState<string[]>(['']);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<WishlistFormData>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      priority: 'MEDIA',
      status: 'PLANNED',
      purchaseLinks: [],
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
      const photoFile = photoInputRef.current?.files?.[0] || null;
      const validLinks = purchaseLinks.filter(link => link.trim() !== '');

      const formData: CreateWishlistItemFormData = {
        name: data.name,
        priority: data.priority,
        estimatedPrice: data.estimatedPrice || null,
        utilityNote: data.utilityNote || null,
        targetDate: data.targetDate || null,
        status: data.status || 'PLANNED',
        photo: photoFile,
        purchaseLinks: validLinks.length > 0 ? validLinks : null,
      };

      if (editing) {
        if (!photoFile && editing.photoUrl) {
          formData.photoUrl = editing.photoUrl;
        }
        await wishlistApi.update(editing.id, formData);
        toast.success('Item atualizado com sucesso!');
      } else {
        await wishlistApi.create(formData);
        toast.success('Item criado com sucesso!');
      }
      reset();
      setPurchaseLinks(['']);
      setShowModal(false);
      setEditing(null);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao salvar item. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditing(item);
    setPurchaseLinks(item.purchaseLinks && item.purchaseLinks.length > 0 ? item.purchaseLinks : ['']);
    reset({
      name: item.name,
      priority: item.priority,
      estimatedPrice: item.estimatedPrice ? Number(item.estimatedPrice) : null,
      utilityNote: item.utilityNote || '',
      targetDate: item.targetDate ? item.targetDate.split('T')[0] : null,
      status: item.status,
      photo: null,
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
    setPurchaseLinks(['']);
    reset();
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const addPurchaseLink = () => {
    setPurchaseLinks([...purchaseLinks, '']);
  };

  const removePurchaseLink = (index: number) => {
    setPurchaseLinks(purchaseLinks.filter((_, i) => i !== index));
  };

  const updatePurchaseLink = (index: number, value: string) => {
    const newLinks = [...purchaseLinks];
    newLinks[index] = value;
    setPurchaseLinks(newLinks);
  };

  const getPriorityBadge = (priority: WishlistPriority) => {
    const config = priorityConfig[priority];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const plannedItems = items.filter(i => i.status === 'PLANNED');
  const boughtItems = items.filter(i => i.status === 'BOUGHT');
  const totalEstimated = plannedItems.reduce((sum, item) => sum + (Number(item.estimatedPrice) || 0), 0);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
              <div key={item.id} className="p-4">
                <div className="flex gap-4">
                  {item.photoUrl && (
                    <img
                      src={`${apiUrl}${item.photoUrl}`}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium">{item.name}</div>
                      {getPriorityBadge(item.priority)}
                    </div>
                    {item.utilityNote && <div className="text-sm text-gray-500 mb-1">{item.utilityNote}</div>}
                    {item.targetDate && (
                      <div className="text-sm text-gray-500 mb-2">
                        Meta: {formatDate(item.targetDate)}
                      </div>
                    )}
                    {item.purchaseLinks && item.purchaseLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.purchaseLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Link {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {item.estimatedPrice && (
                      <div className="font-bold text-gray-900">{formatCurrency(item.estimatedPrice)}</div>
                    )}
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">
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
                    Prioridade <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('priority')}
                    className={`mt-1 block w-full rounded-md px-3 py-2 border ${
                      errors.priority ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="SUPERFLUO">Superfluo</option>
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="ESSENCIAL">Essencial</option>
                  </select>
                  {errors.priority && <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Foto (opcional)</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    ref={(e) => {
                      photoInputRef.current = e;
                      register('photo').ref(e);
                    }}
                    onChange={(e) => {
                      register('photo').onChange(e);
                    }}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editing && editing.photoUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Foto atual:</p>
                      <img
                        src={`${apiUrl}${editing.photoUrl}`}
                        alt={editing.name}
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Links para Compra (opcional)</label>
                  <div className="space-y-2 mt-1">
                    {purchaseLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updatePurchaseLink(index, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 block rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {purchaseLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePurchaseLink(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPurchaseLink}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Adicionar outro link
                    </button>
                  </div>
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
