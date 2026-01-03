import { prisma } from '../../config/database';
import { WishlistStatus } from '@prisma/client';

export class WishlistService {
  async list(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: [
        { priority: 'desc' },
        { estimatedPrice: 'asc' },
      ],
    });
  }

  async create(userId: string, data: {
    name: string;
    priority: number;
    estimatedPrice?: number | null;
    utilityNote?: string | null;
    targetDate?: string | null;
    status?: WishlistStatus;
  }) {
    return prisma.wishlistItem.create({
      data: {
        name: data.name,
        priority: data.priority,
        estimatedPrice: data.estimatedPrice || null,
        utilityNote: data.utilityNote || null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status || WishlistStatus.PLANNED,
        userId,
      },
    });
  }

  async update(userId: string, id: string, data: {
    name?: string;
    priority?: number;
    estimatedPrice?: number | null;
    utilityNote?: string | null;
    targetDate?: string | null;
    status?: WishlistStatus;
  }) {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Item não encontrado');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.estimatedPrice !== undefined) updateData.estimatedPrice = data.estimatedPrice;
    if (data.utilityNote !== undefined) updateData.utilityNote = data.utilityNote;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    if (data.status) updateData.status = data.status;

    return prisma.wishlistItem.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(userId: string, id: string) {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Item não encontrado');
    }

    await prisma.wishlistItem.delete({
      where: { id },
    });
  }
}

export const wishlistService = new WishlistService();

