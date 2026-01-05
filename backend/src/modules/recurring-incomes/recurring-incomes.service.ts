import { prisma } from '../../config/database';
import { TransactionType, CategoryType } from '@prisma/client';

export class RecurringIncomesService {
  async list(userId: string) {
    return prisma.recurringIncome.findMany({
      where: { userId },
      orderBy: { dayOfMonth: 'asc' },
    });
  }

  async create(userId: string, data: {
    name: string;
    amount: number;
    dayOfMonth: number;
    startDate: string;
    endDate?: string | null;
    active?: boolean;
  }) {
    return prisma.recurringIncome.create({
      data: {
        name: data.name,
        amount: data.amount,
        dayOfMonth: data.dayOfMonth,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        active: data.active !== undefined ? data.active : true,
        userId,
      },
    });
  }

  async update(userId: string, id: string, data: {
    name?: string;
    amount?: number;
    dayOfMonth?: number;
    startDate?: string;
    endDate?: string | null;
    active?: boolean;
  }) {
    const item = await prisma.recurringIncome.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Ganho fixo não encontrado');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.active !== undefined) updateData.active = data.active;

    return prisma.recurringIncome.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    const item = await prisma.recurringIncome.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Ganho fixo não encontrado');
    }

    await prisma.recurringIncome.delete({
      where: { id },
    });
  }

  async createAllAsTransactions(userId: string) {
    const activeIncomes = await prisma.recurringIncome.findMany({
      where: {
        userId,
        active: true,
      },
    });

    if (activeIncomes.length === 0) {
      return { count: 0 };
    }

    // Buscar categoria padrão de receita
    const defaultCategory = await prisma.category.findFirst({
      where: {
        type: CategoryType.INCOME,
        OR: [
          { isDefault: true },
          { userId },
        ],
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    if (!defaultCategory) {
      throw new Error('Nenhuma categoria de receita encontrada');
    }

    const now = new Date();
    const transactions = activeIncomes.map((income: any) => ({
      type: TransactionType.INCOME,
      amount: income.amount,
      date: now,
      description: income.name,
      categoryId: defaultCategory.id,
      userId,
      isImportant: false,
    }));

    await prisma.transaction.createMany({
      data: transactions,
    });

    return { count: transactions.length };
  }

  async createTransactionFromIncome(userId: string, incomeId: string) {
    const income = await prisma.recurringIncome.findFirst({
      where: {
        id: incomeId,
        userId,
      },
    });

    if (!income) {
      throw new Error('Ganho fixo não encontrado');
    }

    // Buscar categoria padrão de receita
    const defaultCategory = await prisma.category.findFirst({
      where: {
        type: CategoryType.INCOME,
        OR: [
          { isDefault: true },
          { userId },
        ],
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    if (!defaultCategory) {
      throw new Error('Nenhuma categoria de receita encontrada');
    }

    const now = new Date();
    const transaction = await prisma.transaction.create({
      data: {
        type: TransactionType.INCOME,
        amount: income.amount,
        date: now,
        description: income.name,
        categoryId: defaultCategory.id,
        userId,
        isImportant: false,
      },
      include: {
        category: true,
      },
    });

    return transaction;
  }
}

export const recurringIncomesService = new RecurringIncomesService();

