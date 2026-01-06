-- AlterTable
ALTER TABLE `recurring_incomes` ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT 'Ganho Fixo';

-- AlterTable
ALTER TABLE `recurring_expenses` ADD COLUMN `name` VARCHAR(191) NOT NULL DEFAULT 'Gasto Fixo';

