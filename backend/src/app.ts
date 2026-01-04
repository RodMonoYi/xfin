import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { onboardingRouter } from './modules/onboarding/onboarding.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { transactionsRouter } from './modules/transactions/transactions.routes';
import { recurringIncomesRouter } from './modules/recurring-incomes/recurring-incomes.routes';
import { recurringExpensesRouter } from './modules/recurring-expenses/recurring-expenses.routes';
import { debtsRouter } from './modules/debts/debts.routes';
import { receivablesRouter } from './modules/receivables/receivables.routes';
import { wishlistRouter } from './modules/wishlist/wishlist.routes';
import { piggyBanksRouter } from './modules/piggy-banks/piggy-banks.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/recurring-incomes', recurringIncomesRouter);
app.use('/api/v1/recurring-expenses', recurringExpensesRouter);
app.use('/api/v1/debts', debtsRouter);
app.use('/api/v1/receivables', receivablesRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/piggy-banks', piggyBanksRouter);

app.use(errorHandler);

export default app;

