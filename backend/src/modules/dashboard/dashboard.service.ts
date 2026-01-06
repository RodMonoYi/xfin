import { prisma } from '../../config/database';
import { TransactionType, DebtStatus, ReceivableStatus } from '@prisma/client';

export class DashboardService {
  async getSummary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        initialBalance: true,
      },
    });

    if (!user || user.initialBalance === null) {
      throw new Error('Valor inicial não definido');
    }

    const initialBalance = Number(user.initialBalance);

    const incomes = await prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
      },
      _sum: {
        amount: true,
      },
    });

    const expenses = await prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
      },
      _sum: {
        amount: true,
      },
    });

    const totalIncome = Number(incomes._sum.amount || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);
    const currentBalance = initialBalance + totalIncome - totalExpenses;

    const openDebts = await prisma.debt.aggregate({
      where: {
        userId,
        status: {
          in: [DebtStatus.OPEN, DebtStatus.OVERDUE],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const openReceivables = await prisma.receivable.aggregate({
      where: {
        userId,
        status: {
          in: [ReceivableStatus.OPEN, ReceivableStatus.OVERDUE],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalDebts = Number(openDebts._sum.totalAmount || 0);
    const totalReceivables = Number(openReceivables._sum.totalAmount || 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthIncomes = await prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.INCOME,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthExpenses = await prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthIncomeTotal = Number(monthIncomes._sum.amount || 0);
    const monthExpenseTotal = Number(monthExpenses._sum.amount || 0);

    const recurringIncomes = await prisma.recurringIncome.findMany({
      where: {
        userId,
        active: true,
      },
    });

    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId,
        active: true,
      },
    });

    const totalRecurringIncome = recurringIncomes.reduce((sum: number, item: { amount: unknown }) => sum + Number(item.amount), 0);
    const totalRecurringExpense = recurringExpenses.reduce((sum: number, item: { amount: unknown }) => sum + Number(item.amount), 0);

    const monthProjection = monthIncomeTotal + totalRecurringIncome - monthExpenseTotal - totalRecurringExpense;

    const pendingDebts = await prisma.debt.findMany({
      where: {
        userId,
        status: {
          in: [DebtStatus.OPEN, DebtStatus.OVERDUE],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    const pendingReceivables = await prisma.receivable.findMany({
      where: {
        userId,
        status: {
          in: [ReceivableStatus.OPEN, ReceivableStatus.OVERDUE],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    return {
      currentBalance,
      initialBalance,
      balanceEvolution: currentBalance - initialBalance,
      totalIncome,
      totalExpenses,
      totalDebts,
      totalReceivables,
      monthIncome: monthIncomeTotal,
      monthExpense: monthExpenseTotal,
      monthProjection,
      totalRecurringIncome,
      totalRecurringExpense,
      pendingDebts,
      pendingReceivables,
    };
  }
}

export const dashboardService = new DashboardService();

