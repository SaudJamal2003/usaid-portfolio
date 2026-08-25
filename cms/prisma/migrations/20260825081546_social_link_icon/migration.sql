-- AlterTable
ALTER TABLE "social_links" ADD COLUMN     "iconId" TEXT;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
