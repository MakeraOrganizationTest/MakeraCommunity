/*
  Warnings:

  - The `blank` column on the `project_files` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "project_files" DROP COLUMN "blank",
ADD COLUMN     "blank" JSONB;
