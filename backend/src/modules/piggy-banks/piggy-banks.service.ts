import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export class PiggyBanksService {
  async list(userId: string) {
    return prisma.piggyBank.findMany({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Últimas 5 transações para preview
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string) {
    const piggyBank = await prisma.piggyBank.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!piggyBank) {
      throw new Error('Caixinha não encontrada');
    }

    return piggyBank;
  }

  async create(userId: string, data: {
    name: string;
    description?: string | null;
    photoUrl?: string | null;
    targetAmount?: number | null;
    amountPerPeriod: number;
    periodType: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH';
  }) {
    return prisma.piggyBank.create({
      data: {
        name: data.name,
        description: data.description || null,
        photoUrl: data.photoUrl || null,
        currentAmount: 0,
        targetAmount: data.targetAmount ? new Prisma.Decimal(data.targetAmount) : null,
        amountPerPeriod: new Prisma.Decimal(data.amountPerPeriod),
        periodType: data.periodType,
        userId,
      },
    });
  }

  async update(userId: string, id: string, data: {
    name?: string;
    description?: string | null;
    photoUrl?: string | null;
    targetAmount?: number | null;
    amountPerPeriod?: number;
    periodType?: 'DAY' | 'WEEK' | 'FORTNIGHT' | 'MONTH';
  }) {
    const piggyBank = await prisma.piggyBank.findFirst({
      where: { id, userId },
    });

    if (!piggyBank) {
      throw new Error('Caixinha não encontrada');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;
    if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount ? new Prisma.Decimal(data.targetAmount) : null;
    if (data.amountPerPeriod !== undefined) updateData.amountPerPeriod = new Prisma.Decimal(data.amountPerPeriod);
    if (data.periodType !== undefined) updateData.periodType = data.periodType;

    return prisma.piggyBank.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    const piggyBank = await prisma.piggyBank.findFirst({
      where: { id, userId },
    });

    if (!piggyBank) {
      throw new Error('Caixinha não encontrada');
    }

    // Deletar foto se existir
    if (piggyBank.photoUrl) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'uploads', path.basename(piggyBank.photoUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.piggyBank.delete({
      where: { id },
    });
  }

  async addTransaction(userId: string, piggyBankId: string, data: {
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    description?: string;
  }) {
    const piggyBank = await prisma.piggyBank.findFirst({
      where: { id: piggyBankId, userId },
    });

    if (!piggyBank) {
      throw new Error('Caixinha não encontrada');
    }

    const amount = data.type === 'DEPOSIT' ? data.amount : -data.amount;
    const newAmount = Number(piggyBank.currentAmount) + amount;

    if (newAmount < 0) {
      throw new Error('Saldo insuficiente na caixinha');
    }

    // Criar transação
    const transaction = await prisma.piggyBankTransaction.create({
      data: {
        piggyBankId,
        amount: new Prisma.Decimal(Math.abs(data.amount)),
        type: data.type,
        description: data.description || null,
      },
    });

    // Atualizar saldo da caixinha
    await prisma.piggyBank.update({
      where: { id: piggyBankId },
      data: {
        currentAmount: new Prisma.Decimal(newAmount),
      },
    });

    return transaction;
  }

  async getTransactions(userId: string, piggyBankId: string) {
    const piggyBank = await prisma.piggyBank.findFirst({
      where: { id: piggyBankId, userId },
    });

    if (!piggyBank) {
      throw new Error('Caixinha não encontrada');
    }

    return prisma.piggyBankTransaction.findMany({
      where: { piggyBankId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const piggyBanksService = new PiggyBanksService();

