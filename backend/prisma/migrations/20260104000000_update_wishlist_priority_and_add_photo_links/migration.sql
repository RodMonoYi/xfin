-- AlterTable: Change priority from Int to Enum
-- First, we need to add the new enum if it doesn't exist
-- Note: MySQL doesn't support ALTER TYPE, so we'll need to:
-- 1. Add new columns
-- 2. Migrate data
-- 3. Drop old column
-- 4. Rename new column

-- Step 1: Add new columns
ALTER TABLE `wishlist_items` 
  ADD COLUMN `priority_new` ENUM('SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL') NULL,
  ADD COLUMN `photo_url` VARCHAR(191) NULL,
  ADD COLUMN `purchase_links` JSON NULL;

-- Step 2: Migrate priority data (1=SUPERFLUO, 2=BAIXA, 3=MEDIA, 4=ALTA, 5=ESSENCIAL)
UPDATE `wishlist_items` SET `priority_new` = 
  CASE 
    WHEN `priority` = 1 THEN 'SUPERFLUO'
    WHEN `priority` = 2 THEN 'BAIXA'
    WHEN `priority` = 3 THEN 'MEDIA'
    WHEN `priority` = 4 THEN 'ALTA'
    WHEN `priority` = 5 THEN 'ESSENCIAL'
    ELSE 'MEDIA'
  END;

-- Step 3: Make priority_new NOT NULL and set default
ALTER TABLE `wishlist_items` 
  MODIFY COLUMN `priority_new` ENUM('SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL') NOT NULL DEFAULT 'MEDIA';

-- Step 4: Drop old priority column
ALTER TABLE `wishlist_items` DROP COLUMN `priority`;

-- Step 5: Rename new column
ALTER TABLE `wishlist_items` CHANGE COLUMN `priority_new` `priority` ENUM('SUPERFLUO', 'BAIXA', 'MEDIA', 'ALTA', 'ESSENCIAL') NOT NULL DEFAULT 'MEDIA';

