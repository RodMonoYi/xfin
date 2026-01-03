import { useEffect, useState } from 'react';
import { wishlistApi, WishlistItem, CreateWishlistItemData } from '../api/wishlist';
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate } from '../utils/format';

export const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await wishlistApi.list();
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar lista de desejos:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <div className="text-sm text-gray-600">Total Estimado</div>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(totalEstimated)}</div>
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
      </div>
    </Layout>
  );
};

