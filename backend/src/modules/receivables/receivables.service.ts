import { prisma } from '../../config/database';
import { ReceivableStatus, TransactionType, CategoryType } from '@prisma/client';

export class ReceivablesService {
  async list(userId: string) {
    const receivables = await prisma.receivable.findMany({
      where: { userId },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    // Atualizar status para OVERDUE se necessário
    const now = new Date();
    for (const receivable of receivables) {
      if (receivable.status === ReceivableStatus.OPEN && receivable.dueDate < now && !receivable.receivedAt) {
        await prisma.receivable.update({
          where: { id: receivable.id },
          data: { status: ReceivableStatus.OVERDUE },
        });
        receivable.status = ReceivableStatus.OVERDUE;
      }
    }

    return receivables;
  }

  async create(userId: string, data: {
    debtorName: string;
    description?: string;
    totalAmount: number;
    dueDate: string;
  }) {
    const status = new Date(data.dueDate) < new Date() ? ReceivableStatus.OVERDUE : ReceivableStatus.OPEN;

    return prisma.receivable.create({
      data: {
        debtorName: data.debtorName,
        description: data.description,
        totalAmount: data.totalAmount,
        dueDate: new Date(data.dueDate),
        status,
        userId,
      },
    });
  }

  async update(userId: string, id: string, data: {
    debtorName?: string;
    description?: string;
    totalAmount?: number;
    dueDate?: string;
  }) {
    const receivable = await prisma.receivable.findFirst({
      where: { id, userId },
    });

    if (!receivable) {
      throw new Error('Recebível não encontrado');
    }

    // Bloquear edição se estiver recebido
    if (receivable.status === ReceivableStatus.RECEIVED) {
      throw new Error('Não é possível editar um recebível que já foi recebido. Reabra o recebível primeiro.');
    }

    const updateData: any = {};
    if (data.debtorName) updateData.debtorName = data.debtorName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
      // Atualizar status se necessário
      if (!receivable.receivedAt && new Date(data.dueDate) < new Date()) {
        updateData.status = ReceivableStatus.OVERDUE;
      } else if (!receivable.receivedAt && receivable.status === ReceivableStatus.OVERDUE && new Date(data.dueDate) >= new Date()) {
        updateData.status = ReceivableStatus.OPEN;
      }
    }

    return prisma.receivable.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    const receivable = await prisma.receivable.findFirst({
      where: { id, userId },
    });

    if (!receivable) {
      throw new Error('Recebível não encontrado');
    }

    await prisma.receivable.delete({
      where: { id },
    });
  }

  async markReceived(userId: string, id: string) {
    const receivable = await prisma.receivable.findFirst({
      where: { id, userId },
    });

    if (!receivable) {
      throw new Error('Recebível não encontrado');
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

    // Criar transação automaticamente
    const now = new Date();
    await prisma.transaction.create({
      data: {
        type: TransactionType.INCOME,
        amount: receivable.totalAmount,
        date: now,
        description: receivable.description || `Recebimento: ${receivable.debtorName}`,
        categoryId: defaultCategory.id,
        userId,
      },
    });

    return prisma.receivable.update({
      where: { id },
      data: {
        status: ReceivableStatus.RECEIVED,
        receivedAt: now,
      },
    });
  }

  async unmarkReceived(userId: string, id: string) {
    const receivable = await prisma.receivable.findFirst({
      where: { id, userId },
    });

    if (!receivable) {
      throw new Error('Recebível não encontrado');
    }

    if (receivable.status !== ReceivableStatus.RECEIVED) {
      throw new Error('Este recebível não está marcado como recebido');
    }

    // Determinar o status correto baseado na data de vencimento
    const now = new Date();
    const status = receivable.dueDate < now ? ReceivableStatus.OVERDUE : ReceivableStatus.OPEN;

    return prisma.receivable.update({
      where: { id },
      data: {
        status,
        receivedAt: null,
      },
    });
  }
}

export const receivablesService = new ReceivablesService();

