import { prisma } from '../../config/database';
import { Priority, DebtStatus, RecurrenceType } from '@prisma/client';

export class DebtsService {
  async list(userId: string) {
    const debts = await prisma.debt.findMany({
      where: { userId },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    // Atualizar status para OVERDUE se necessário
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
  }) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new Error('Dívida não encontrada');
    }

    // Bloquear edição se estiver paga
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
      // Atualizar status se necessário
      if (!debt.paidAt && new Date(data.dueDate) < new Date()) {
        updateData.status = DebtStatus.OVERDUE;
      } else if (!debt.paidAt && debt.status === DebtStatus.OVERDUE && new Date(data.dueDate) >= new Date()) {
        updateData.status = DebtStatus.OPEN;
      }
    }
    if (data.priority) updateData.priority = data.priority;

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

    return prisma.debt.update({
      where: { id },
      data: {
        status: DebtStatus.PAID,
        paidAt: new Date(),
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

    // Determinar o status correto baseado na data de vencimento
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

