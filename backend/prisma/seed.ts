import { PrismaClient, CategoryType, TransactionType, PaymentMethod, Priority, DebtStatus, ReceivableStatus, WishlistStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar categorias padrão
  const defaultCategories = [
    { name: 'Alimentação', type: CategoryType.EXPENSE },
    { name: 'Transporte', type: CategoryType.EXPENSE },
    { name: 'Saúde', type: CategoryType.EXPENSE },
    { name: 'Moradia', type: CategoryType.EXPENSE },
    { name: 'Lazer', type: CategoryType.EXPENSE },
    { name: 'Educação', type: CategoryType.EXPENSE },
    { name: 'Impostos', type: CategoryType.EXPENSE },
    { name: 'Investimentos', type: CategoryType.EXPENSE },
    { name: 'Salário', type: CategoryType.INCOME },
    { name: 'Freelance', type: CategoryType.INCOME },
    { name: 'Investimentos', type: CategoryType.INCOME },
    { name: 'Outros', type: CategoryType.INCOME },
  ];

  const createdCategories = [];
  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, isDefault: true }
    });
    if (!existing) {
      const category = await prisma.category.create({
        data: {
          ...cat,
          isDefault: true,
        },
      });
      createdCategories.push(category);
      console.log(`✅ Categoria criada: ${cat.name}`);
    } else {
      createdCategories.push(existing);
    }
  }

  // Criar usuário demo
  const demoPasswordHash = await bcrypt.hash('demo123', 10);
  
  let demoUser = await prisma.user.findUnique({
    where: { email: 'demo@xfin.com' }
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        name: 'Usuário Demo',
        email: 'demo@xfin.com',
        passwordHash: demoPasswordHash,
        initialBalance: 5000.00,
        initialBalanceSetAt: new Date(),
      },
    });
    console.log('✅ Usuário demo criado');
  } else {
    console.log('ℹ️ Usuário demo já existe');
  }

  // Criar categorias personalizadas do usuário demo
  const userCategories = [];
  const foodCategory = createdCategories.find(c => c.name === 'Alimentação');
  const transportCategory = createdCategories.find(c => c.name === 'Transporte');
  const salaryCategory = createdCategories.find(c => c.name === 'Salário');

  if (foodCategory) userCategories.push(foodCategory);
  if (transportCategory) userCategories.push(transportCategory);
  if (salaryCategory) userCategories.push(salaryCategory);

  // Criar transações de exemplo
  const transactionsCount = await prisma.transaction.count({
    where: { userId: demoUser.id }
  });

  if (transactionsCount === 0 && userCategories.length > 0) {
    const now = new Date();
    
    // Transações de receita
    await prisma.transaction.create({
      data: {
        type: TransactionType.INCOME,
        amount: 5000.00,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        description: 'Salário mensal',
        categoryId: salaryCategory!.id,
        userId: demoUser.id,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      },
    });

    // Transações de despesa
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        amount: 800.00,
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        description: 'Supermercado mensal',
        categoryId: foodCategory!.id,
        userId: demoUser.id,
        paymentMethod: PaymentMethod.CARD,
        isImportant: true,
      },
    });

    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        amount: 150.00,
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        description: 'Combustível',
        categoryId: transportCategory!.id,
        userId: demoUser.id,
        paymentMethod: PaymentMethod.CARD,
      },
    });

    console.log('✅ Transações de exemplo criadas');
  }

  // Criar dívidas de exemplo
  const debtsCount = await prisma.debt.count({
    where: { userId: demoUser.id }
  });

  if (debtsCount === 0) {
    await prisma.debt.create({
      data: {
        creditorName: 'Banco XYZ',
        description: 'Cartão de crédito',
        totalAmount: 1500.00,
        isRecurring: false,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
        priority: Priority.HIGH,
        status: DebtStatus.OPEN,
        userId: demoUser.id,
      },
    });

    console.log('✅ Dívidas de exemplo criadas');
  }

  // Criar recebíveis de exemplo
  const receivablesCount = await prisma.receivable.count({
    where: { userId: demoUser.id }
  });

  if (receivablesCount === 0) {
    await prisma.receivable.create({
      data: {
        debtorName: 'Cliente ABC',
        description: 'Pagamento de projeto',
        totalAmount: 3000.00,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        status: ReceivableStatus.OPEN,
        userId: demoUser.id,
      },
    });

    console.log('✅ Recebíveis de exemplo criados');
  }

  // Criar itens da lista de desejos
  const wishlistCount = await prisma.wishlistItem.count({
    where: { userId: demoUser.id }
  });

  if (wishlistCount === 0) {
    await prisma.wishlistItem.create({
      data: {
        name: 'Notebook novo',
        priority: 5,
        estimatedPrice: 3500.00,
        utilityNote: 'Para trabalho',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: WishlistStatus.PLANNED,
        userId: demoUser.id,
      },
    });

    await prisma.wishlistItem.create({
      data: {
        name: 'Fone de ouvido',
        priority: 3,
        estimatedPrice: 200.00,
        utilityNote: 'Para reuniões',
        status: WishlistStatus.PLANNED,
        userId: demoUser.id,
      },
    });

    console.log('✅ Itens da lista de desejos criados');
  }

  // Criar ganhos fixos
  const recurringIncomesCount = await prisma.recurringIncome.count({
    where: { userId: demoUser.id }
  });

  if (recurringIncomesCount === 0) {
    await prisma.recurringIncome.create({
      data: {
        name: 'Salário',
        amount: 5000.00,
        dayOfMonth: 5,
        startDate: new Date(),
        active: true,
        userId: demoUser.id,
      },
    });

    console.log('✅ Ganhos fixos criados');
  }

  // Criar gastos fixos
  const recurringExpensesCount = await prisma.recurringExpense.count({
    where: { userId: demoUser.id }
  });

  if (recurringExpensesCount === 0) {
    await prisma.recurringExpense.create({
      data: {
        name: 'Aluguel',
        amount: 1200.00,
        dayOfMonth: 10,
        startDate: new Date(),
        active: true,
        userId: demoUser.id,
      },
    });

    console.log('✅ Gastos fixos criados');
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

