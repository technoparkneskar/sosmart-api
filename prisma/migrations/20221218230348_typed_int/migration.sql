/*
  Warnings:

  - Changed the type of `type` on the `product_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "product_history" DROP COLUMN "type",
ADD COLUMN     "type" INTEGER NOT NULL;
