import { prisma } from '../../config/database';

export class OnboardingService {
  async setInitialBalance(userId: string, initialBalance: number) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        initialBalance,
        initialBalanceSetAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        initialBalance: true,
        initialBalanceSetAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}

export const onboardingService = new OnboardingService();

