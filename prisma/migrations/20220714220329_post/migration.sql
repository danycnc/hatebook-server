-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_author_Id_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "author_Id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_Id_fkey" FOREIGN KEY ("author_Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
