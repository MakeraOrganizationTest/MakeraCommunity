/*
  Warnings:

  - You are about to drop the `project_file_downloads` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `file_id` to the `project_downloads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_type` to the `project_downloads` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('project_file', 'original_file', 'attachment');

-- DropForeignKey
ALTER TABLE "project_file_downloads" DROP CONSTRAINT "project_file_downloads_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_file_downloads" DROP CONSTRAINT "project_file_downloads_user_id_fkey";

-- DropIndex
DROP INDEX "project_downloads_project_id_user_id_key";

-- AlterTable
ALTER TABLE "project_downloads" ADD COLUMN     "file_id" UUID NOT NULL,
ADD COLUMN     "file_type" "FileType" NOT NULL,
ADD COLUMN     "ip_address" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "project_files" ADD COLUMN     "downloads_count" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "project_file_downloads";

-- CreateIndex
CREATE INDEX "project_downloads_project_id_idx" ON "project_downloads"("project_id");

-- CreateIndex
CREATE INDEX "project_downloads_user_id_idx" ON "project_downloads"("user_id");

-- CreateIndex
CREATE INDEX "project_downloads_file_type_file_id_idx" ON "project_downloads"("file_type", "file_id");
