import { Router } from 'express';
import { wishlistController } from './wishlist.controller';
import { authenticate } from '../../middlewares/auth';

export const wishlistRouter = Router();

wishlistRouter.get('/', authenticate, wishlistController.list.bind(wishlistController));
wishlistRouter.post('/', authenticate, wishlistController.create.bind(wishlistController));
wishlistRouter.put('/:id', authenticate, wishlistController.update.bind(wishlistController));
wishlistRouter.delete('/:id', authenticate, wishlistController.delete.bind(wishlistController));

