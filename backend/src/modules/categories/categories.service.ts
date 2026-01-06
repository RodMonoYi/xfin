import { prisma } from '../../config/database';
import { CategoryType } from '@prisma/client';

export class CategoriesService {
  async list(userId: string) {
    const categories = await prisma.category.findMany({
      where: {
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

    return categories;
  }

  async create(userId: string, data: { name: string; type: CategoryType }) {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        type: data.type,
        userId,
        isDefault: false,
      },
    });

    return category;
  }

  async update(userId: string, id: string, data: { name?: string; type?: CategoryType }) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isDefault: true },
        ],
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (category.isDefault) {
      throw new Error('Não é possível editar categorias padrão');
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return updated;
  }

  async delete(userId: string, id: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (category.isDefault) {
      throw new Error('Não é possível deletar categorias padrão');
    }

    await prisma.category.delete({
      where: { id },
    });
  }

  async findOrCreateUnspecified(userId: string, type: CategoryType): Promise<string> {
    let category = await prisma.category.findFirst({
      where: {
        name: 'Não especificado',
        type,
        OR: [
          { userId },
          { isDefault: true },
        ],
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Não especificado',
          type,
          isDefault: true,
        },
      });
    }

    return category.id;
  }
}

export const categoriesService = new CategoriesService();

