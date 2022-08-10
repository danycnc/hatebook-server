/*
  Warnings:

  - You are about to drop the column `author_Id` on the `Post` table. All the data in the column will be lost.
  - Added the required column `author_name` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_author_Id_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "author_Id",
ADD COLUMN     "author_id" INTEGER,
ADD COLUMN     "author_name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
