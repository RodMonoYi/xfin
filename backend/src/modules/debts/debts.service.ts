import { prisma } from '../../config/database';
import { Priority, DebtStatus, RecurrenceType, TransactionType, CategoryType } from '@prisma/client';
import { categoriesService } from '../categories/categories.service';

export class DebtsService {
  async list(userId: string) {
    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    const now = new Date();
    for (const debt of debts) {
      if (debt.status === DebtStatus.OPEN && debt.dueDate < now && !debt.paidAt) {
        await prisma.debt.update({
          where: { id: debt.id },
          data: { status: DebtStatus.OVERDUE },
        });
        debt.status = DebtStatus.OVERDUE;
      }
    }

    return debts;
  }

  async create(userId: string, data: {
    creditorName: string;
    description?: string;
    totalAmount: number;
    isRecurring?: boolean;
    recurrence?: RecurrenceType | null;
    startDate: string;
    dueDate: string;
    priority?: Priority;
    categoryId?: string | null;
  }) {
    const status = new Date(data.dueDate) < new Date() ? DebtStatus.OVERDUE : DebtStatus.OPEN;

    return prisma.debt.create({
      data: {
        creditorName: data.creditorName,
        description: data.description,
        totalAmount: data.totalAmount,
        isRecurring: data.isRecurring || false,
        recurrence: data.recurrence || null,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        priority: data.priority || Priority.MEDIUM,
        status,
        categoryId: data.categoryId || null,
        userId,
      },
    });
  }

  async update(userId: string, id: string, data: {
    creditorName?: string;
    description?: string;
    totalAmount?: number;
    isRecurring?: boolean;
    recurrence?: RecurrenceType | null;
    startDate?: string;
    dueDate?: string;
    priority?: Priority;
    categoryId?: string | null;
  }) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new Error('Dívida não encontrada');
    }

    if (debt.status === DebtStatus.PAID) {
      throw new Error('Não é possível editar uma dívida que já foi paga. Reabra a dívida primeiro.');
    }

    const updateData: any = {};
    if (data.creditorName) updateData.creditorName = data.creditorName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
      if (!debt.paidAt && new Date(data.dueDate) < new Date()) {
        updateData.status = DebtStatus.OVERDUE;
      } else if (!debt.paidAt && debt.status === DebtStatus.OVERDUE && new Date(data.dueDate) >= new Date()) {
        updateData.status = DebtStatus.OPEN;
      }
    }
    if (data.priority) updateData.priority = data.priority;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    return prisma.debt.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new Error('Dívida não encontrada');
    }

    await prisma.debt.delete({
      where: { id },
    });
  }

  async markPaid(userId: string, id: string) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new Error('Dívida não encontrada');
    }

    let categoryId: string;
    if (debt.categoryId) {
      categoryId = debt.categoryId;
    } else {
      categoryId = await categoriesService.findOrCreateUnspecified(userId, CategoryType.EXPENSE);
    }

    const now = new Date();
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        amount: debt.totalAmount,
        date: now,
        description: debt.description || `Pagamento: ${debt.creditorName}`,
        categoryId,
        userId,
        isImportant: debt.priority === Priority.HIGH,
      },
    });

    return prisma.debt.update({
      where: { id },
      data: {
        status: DebtStatus.PAID,
        paidAt: now,
      },
    });
  }

  async unmarkPaid(userId: string, id: string) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new Error('Dívida não encontrada');
    }

    if (debt.status !== DebtStatus.PAID) {
      throw new Error('Esta dívida não está marcada como paga');
    }

    const now = new Date();
    const status = debt.dueDate < now ? DebtStatus.OVERDUE : DebtStatus.OPEN;

    return prisma.debt.update({
      where: { id },
      data: {
        status,
        paidAt: null,
      },
    });
  }
}

export const debtsService = new DebtsService();

