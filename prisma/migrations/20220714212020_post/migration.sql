-- CreateTable
CREATE TABLE "Post" (
    "author_Id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "likes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_Id_fkey" FOREIGN KEY ("author_Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
