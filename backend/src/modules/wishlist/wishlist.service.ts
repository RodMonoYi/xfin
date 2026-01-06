import { prisma } from '../../config/database';
import { WishlistStatus, WishlistPriority } from '@prisma/client';

const priorityOrder: Record<WishlistPriority, number> = {
  SUPERFLUO: 1,
  BAIXA: 2,
  MEDIA: 3,
  ALTA: 4,
  ESSENCIAL: 5,
};

export class WishlistService {
  async list(userId: string) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
    });
    
    // Ordenar por prioridade (ordem do enum) e depois por preço
    return items.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      const priceA = Number(a.estimatedPrice) || 0;
      const priceB = Number(b.estimatedPrice) || 0;
      return priceA - priceB;
    });
  }

  async create(userId: string, data: {
    name: string;
    priority: WishlistPriority;
    estimatedPrice?: number | null;
    utilityNote?: string | null;
    targetDate?: string | null;
    status?: WishlistStatus;
    photoUrl?: string | null;
    purchaseLinks?: string[] | null;
  }) {
    return prisma.wishlistItem.create({
      data: {
        name: data.name,
        priority: data.priority,
        estimatedPrice: data.estimatedPrice || null,
        utilityNote: data.utilityNote || null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status || WishlistStatus.PLANNED,
        photoUrl: data.photoUrl || null,
        purchaseLinks: data.purchaseLinks || null,
        userId,
      },
    });
  }

  async update(userId: string, id: string, data: {
    name?: string;
    priority?: WishlistPriority;
    estimatedPrice?: number | null;
    utilityNote?: string | null;
    targetDate?: string | null;
    status?: WishlistStatus;
    photoUrl?: string | null;
    purchaseLinks?: string[] | null;
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
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.purchaseLinks !== undefined) updateData.purchaseLinks = data.purchaseLinks;

    return prisma.wishlistItem.update({
      where: { id },
      data: updateData,
    });
  }

  async findById(userId: string, id: string) {
    const item = await prisma.wishlistItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new Error('Item não encontrado');
    }

    return item;
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

