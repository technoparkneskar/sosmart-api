/*
  Warnings:

  - You are about to drop the column `end_at` on the `product_history` table. All the data in the column will be lost.
  - You are about to drop the column `start_at` on the `product_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_history" DROP COLUMN "end_at",
DROP COLUMN "start_at",
ADD COLUMN     "switch_1" TIMESTAMPTZ[],
ADD COLUMN     "switch_2" TIMESTAMPTZ[];
