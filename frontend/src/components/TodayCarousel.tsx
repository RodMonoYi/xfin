import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

interface TodayItem {
  id: string;
  type: 'debt' | 'receivable';
  name: string;
  amount: number;
  dueDate: string;
  description?: string;
}

interface TodayCarouselProps {
  items: TodayItem[];
  onMarkPaid?: (id: string) => void;
  onMarkReceived?: (id: string) => void;
  processingIds?: Set<string>;
  valuesVisible?: boolean;
}

export const TodayCarousel: React.FC<TodayCarouselProps> = ({
  items,
  onMarkPaid,
  onMarkReceived,
  processingIds = new Set(),
  valuesVisible = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (items.length === 0) return;
    
    const interval = setInterval(() => {
      if (isAutoPlaying) {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length, isAutoPlaying]);

  if (items.length === 0) {
    return (
      <div className="relative w-full mb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Atualizações do Dia!</h2>
            </div>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-base">
            Nada pendente para hoje
          </p>
        </div>
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleAction = (item: TodayItem) => {
    if (item.type === 'debt' && onMarkPaid) {
      onMarkPaid(item.id);
    } else if (item.type === 'receivable' && onMarkReceived) {
      onMarkReceived(item.id);
    }
  };

  const currentItem = items[currentIndex];

  return (
    <div className="relative w-full mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Atualizações do Dia!</h2>
          </div>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
            {items.length} {items.length === 1 ? 'pendência' : 'pendências'}
          </span>
        </div>
        {items.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Anterior"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Próximo"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="min-w-full flex-shrink-0">
              <TodayCard
                item={item}
                onAction={handleAction}
                isProcessing={processingIds.has(item.id)}
                valuesVisible={valuesVisible}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-500 w-8'
                  : 'bg-gray-300 dark:bg-gray-600 w-2 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TodayCardProps {
  item: TodayItem;
  onAction: (item: TodayItem) => void;
  isProcessing: boolean;
  valuesVisible: boolean;
}

const TodayCard: React.FC<TodayCardProps> = ({
  item,
  onAction,
  isProcessing,
  valuesVisible,
}) => {
  const isDebt = item.type === 'debt';
  const dueDate = new Date(item.dueDate);
  const isOverdue = dueDate < new Date() && dueDate.toDateString() !== new Date().toDateString();

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl shadow-xl
        ${isDebt 
          ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500' 
          : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500'
        }
        transform transition-all duration-300 hover:scale-[1.02]
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isDebt ? (
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                  {isDebt ? 'Conta a Pagar' : 'Valor a Receber'}
                </p>
                {isOverdue && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                    Vencida
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-white/80 text-sm md:text-base">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
            <p className="text-white/90 text-sm font-medium mb-1">Valor</p>
            <p className="text-4xl md:text-5xl font-black text-white">
              {valuesVisible ? formatCurrency(item.amount) : 'R$ ••••••'}
            </p>
          </div>
        </div>

        {/* Date and Action */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm md:text-base font-medium">
              Vence hoje
            </span>
          </div>

          <button
            onClick={() => onAction(item)}
            disabled={isProcessing}
            className={`
              relative overflow-hidden px-6 py-3 rounded-xl font-bold text-white
              shadow-lg transform transition-all duration-200
              ${isDebt
                ? 'bg-white/30 hover:bg-white/40 active:scale-95'
                : 'bg-white/30 hover:bg-white/40 active:scale-95'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  {isDebt ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Marcar como Pago
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Marcar como Recebido
                    </>
                  )}
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 -top-1/2 -right-1/2 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

