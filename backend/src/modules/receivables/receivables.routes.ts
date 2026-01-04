import { Router } from 'express';
import { receivablesController } from './receivables.controller';
import { authenticate } from '../../middlewares/auth';

export const receivablesRouter = Router();

receivablesRouter.get('/', authenticate, receivablesController.list.bind(receivablesController));
receivablesRouter.post('/', authenticate, receivablesController.create.bind(receivablesController));
receivablesRouter.put('/:id', authenticate, receivablesController.update.bind(receivablesController));
receivablesRouter.delete('/:id', authenticate, receivablesController.delete.bind(receivablesController));
receivablesRouter.patch('/:id/mark-received', authenticate, receivablesController.markReceived.bind(receivablesController));
receivablesRouter.patch('/:id/unmark-received', authenticate, receivablesController.unmarkReceived.bind(receivablesController));

