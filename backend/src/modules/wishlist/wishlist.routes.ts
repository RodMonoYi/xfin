import { Router } from 'express';
import { wishlistController } from './wishlist.controller';
import { authenticate } from '../../middlewares/auth';
import { upload } from '../../utils/upload';

export const wishlistRouter = Router();

wishlistRouter.get('/', authenticate, wishlistController.list.bind(wishlistController));
wishlistRouter.post('/', authenticate, upload, wishlistController.create.bind(wishlistController));
wishlistRouter.put('/:id', authenticate, upload, wishlistController.update.bind(wishlistController));
wishlistRouter.delete('/:id', authenticate, wishlistController.delete.bind(wishlistController));

