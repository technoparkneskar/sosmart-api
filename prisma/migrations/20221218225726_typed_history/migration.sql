/*
  Warnings:

  - You are about to drop the column `switch_1` on the `product_history` table. All the data in the column will be lost.
  - You are about to drop the column `switch_2` on the `product_history` table. All the data in the column will be lost.
  - Added the required column `end_at` to the `product_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_at` to the `product_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `product_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_history" DROP COLUMN "switch_1",
DROP COLUMN "switch_2",
ADD COLUMN     "end_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "start_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "type" VARCHAR NOT NULL;
