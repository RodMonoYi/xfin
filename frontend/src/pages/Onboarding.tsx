import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { onboardingApi } from '../api/onboarding';
import { useAuth } from '../auth/AuthContext';

const onboardingSchema = z.object({
  initialBalance: z.number().min(0, 'O valor deve ser maior ou igual a zero'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormData) => {
    setError('');
    setLoading(true);
    try {
      await onboardingApi.setInitialBalance({ initialBalance: data.initialBalance });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao definir valor inicial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-400">X-Fin</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Bem-vindo ao X-Fin!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Para começar, precisamos saber quanto dinheiro você tem hoje.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
            </div>
          )}
          <div>
            <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quanto dinheiro você tem hoje?
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">R$</span>
              </div>
              <input
                {...register('initialBalance', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 sm:text-sm"
                placeholder="0,00"
              />
            </div>
            {errors.initialBalance && (
              <p className="mt-1 text-sm text-red-600">{errors.initialBalance.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

