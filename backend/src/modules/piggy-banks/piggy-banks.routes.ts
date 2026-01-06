import { Router } from 'express';
import { piggyBanksController } from './piggy-banks.controller';
import { authenticate } from '../../middlewares/auth';
import { upload } from '../../utils/upload';

export const piggyBanksRouter = Router();

piggyBanksRouter.get('/', authenticate, piggyBanksController.list.bind(piggyBanksController));
piggyBanksRouter.get('/:id', authenticate, piggyBanksController.findById.bind(piggyBanksController));
piggyBanksRouter.post('/', authenticate, upload, piggyBanksController.create.bind(piggyBanksController));
piggyBanksRouter.put('/:id', authenticate, upload, piggyBanksController.update.bind(piggyBanksController));
piggyBanksRouter.delete('/:id', authenticate, piggyBanksController.delete.bind(piggyBanksController));
piggyBanksRouter.post('/:id/transactions', authenticate, piggyBanksController.addTransaction.bind(piggyBanksController));
piggyBanksRouter.get('/:id/transactions', authenticate, piggyBanksController.getTransactions.bind(piggyBanksController));

