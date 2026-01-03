import { prisma } from '../../config/database';

export class RecurringIncomesService {
  async list(userId: string) {
    return prisma.recurringIncome.findMany({
      where: { userId },
      orderBy: { dayOfMonth: 'asc' },
    });
  }

  async create(userId: string, data: {
    amount: number;
    dayOfMonth: number;
    startDate: string;
    endDate?: string | null;
    active?: boolean;
  }) {
    return prisma.recurringIncome.create({
      data: {
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
}

export const recurringIncomesService = new RecurringIncomesService();

