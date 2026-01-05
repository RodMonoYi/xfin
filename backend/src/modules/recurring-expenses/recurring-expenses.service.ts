import { prisma } from '../../config/database';
import { TransactionType, CategoryType } from '@prisma/client';

export class RecurringExpensesService {
  async list(userId: string) {
    return prisma.recurringExpense.findMany({
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
    return prisma.recurringExpense.create({
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
    const item = await prisma.recurringExpense.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Gasto fixo não encontrado');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.active !== undefined) updateData.active = data.active;

    return prisma.recurringExpense.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    const item = await prisma.recurringExpense.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Gasto fixo não encontrado');
    }

    await prisma.recurringExpense.delete({
      where: { id },
    });
  }

  async createAllAsTransactions(userId: string) {
    const activeExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId,
        active: true,
      },
    });

    if (activeExpenses.length === 0) {
      return { count: 0 };
    }

    // Buscar categoria padrão de despesa
    const defaultCategory = await prisma.category.findFirst({
      where: {
        type: CategoryType.EXPENSE,
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
      throw new Error('Nenhuma categoria de despesa encontrada');
    }

    const now = new Date();
    const transactions = activeExpenses.map((expense: any) => ({
      type: TransactionType.EXPENSE,
      amount: expense.amount,
      date: now,
      description: expense.name,
      categoryId: defaultCategory.id,
      userId,
      isImportant: false,
    }));

    await prisma.transaction.createMany({
      data: transactions,
    });

    return { count: transactions.length };
  }

  async createTransactionFromExpense(userId: string, expenseId: string) {
    const expense = await prisma.recurringExpense.findFirst({
      where: {
        id: expenseId,
        userId,
      },
    });

    if (!expense) {
      throw new Error('Gasto fixo não encontrado');
    }

    // Buscar categoria padrão de despesa
    const defaultCategory = await prisma.category.findFirst({
      where: {
        type: CategoryType.EXPENSE,
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
      throw new Error('Nenhuma categoria de despesa encontrada');
    }

    const now = new Date();
    const transaction = await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        amount: expense.amount,
        date: now,
        description: expense.name,
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

export const recurringExpensesService = new RecurringExpensesService();

