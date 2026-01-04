import { prisma } from '../../config/database';
import { ReceivableStatus } from '@prisma/client';

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

    return prisma.receivable.update({
      where: { id },
      data: {
        status: ReceivableStatus.RECEIVED,
        receivedAt: new Date(),
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

