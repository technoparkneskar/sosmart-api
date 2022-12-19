/*
  Warnings:

  - The `start_at` column on the `product_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `end_at` column on the `product_history` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "product_history" DROP COLUMN "start_at",
ADD COLUMN     "start_at" TIMESTAMPTZ[],
DROP COLUMN "end_at",
ADD COLUMN     "end_at" TIMESTAMPTZ[];
