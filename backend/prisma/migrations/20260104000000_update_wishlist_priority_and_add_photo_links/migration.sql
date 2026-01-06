ALTER TABLE `wishlist_items` 
  ADD COLUMN `priority_new` ENUM('SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL') NULL,
  ADD COLUMN `photo_url` VARCHAR(191) NULL,
  ADD COLUMN `purchase_links` JSON NULL;

UPDATE `wishlist_items` SET `priority_new` = 
  CASE 
    WHEN `priority` = 1 THEN 'SUPERFLUO'
    WHEN `priority` = 2 THEN 'BAIXA'
    WHEN `priority` = 3 THEN 'MEDIA'
    WHEN `priority` = 4 THEN 'ALTA'
    WHEN `priority` = 5 THEN 'ESSENCIAL'
    ELSE 'MEDIA'
  END;

ALTER TABLE `wishlist_items` 
  MODIFY COLUMN `priority_new` ENUM('SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL') NOT NULL DEFAULT 'MEDIA';

ALTER TABLE `wishlist_items` DROP COLUMN `priority`;

ALTER TABLE `wishlist_items` CHANGE COLUMN `priority_new` `priority` ENUM('SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL') NOT NULL DEFAULT 'MEDIA';

