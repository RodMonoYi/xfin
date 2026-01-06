import { prisma } from '../../config/database';
import { TransactionType, PaymentMethod } from '@prisma/client';

interface ListFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  type?: string;
  isImportant?: boolean;
}

export class TransactionsService {
  async list(userId: string, filters: ListFilters = {}) {
    const where: any = {
      userId,
    };

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.type) {
      where.type = filters.type as TransactionType;
    }

    if (filters.isImportant !== undefined) {
      where.isImportant = filters.isImportant;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return transactions;
  }

  async create(userId: string, data: {
    type: TransactionType;
    amount: number;
    date: string;
    description?: string;
    categoryId: string;
    isImportant?: boolean;
    paymentMethod?: PaymentMethod;
    isInstallment?: boolean;
    installmentsTotal?: number;
  }) {
    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        categoryId: data.categoryId,
        userId,
        isImportant: data.isImportant || false,
        paymentMethod: data.paymentMethod,
        isInstallment: data.isInstallment || false,
        installmentsTotal: data.installmentsTotal,
        installmentIndex: data.isInstallment && data.installmentsTotal ? 1 : null,
      },
      include: {
        category: true,
      },
    });

    // Se for parcela, criar as outras transações
    if (data.isInstallment && data.installmentsTotal && data.installmentsTotal > 1) {
      const installmentAmount = data.amount / data.installmentsTotal;
      const transactions = [];

      for (let i = 2; i <= data.installmentsTotal; i++) {
        const installmentDate = new Date(data.date);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

        transactions.push({
          type: data.type,
          amount: installmentAmount,
          date: installmentDate,
          description: data.description,
          categoryId: data.categoryId,
          userId,
          isImportant: data.isImportant || false,
          paymentMethod: data.paymentMethod,
          isInstallment: true,
          installmentsTotal: data.installmentsTotal,
          installmentIndex: i,
          parentId: transaction.id,
        });
      }

      await prisma.transaction.createMany({
        data: transactions,
      });
    }

    return transaction;
  }

  async update(userId: string, id: string, data: {
    type?: TransactionType;
    amount?: number;
    date?: string;
    description?: string;
    categoryId?: string;
    isImportant?: boolean;
    paymentMethod?: PaymentMethod;
  }) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date) updateData.date = new Date(data.date);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId) updateData.categoryId = data.categoryId;
    if (data.isImportant !== undefined) updateData.isImportant = data.isImportant;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return updated;
  }

  async delete(userId: string, id: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    // Se for transação principal de parcelas, deletar também as parcelas
    if (transaction.isInstallment && !transaction.parentId) {
      await prisma.transaction.deleteMany({
        where: {
          OR: [
            { id },
            { parentId: id },
          ],
        },
      });
    } else {
      await prisma.transaction.delete({
        where: { id },
      });
    }
  }
}

export const transactionsService = new TransactionsService();

