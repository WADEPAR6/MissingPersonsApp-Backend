/*
  Warnings:

  - Added the required column `location` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Perdid@';
