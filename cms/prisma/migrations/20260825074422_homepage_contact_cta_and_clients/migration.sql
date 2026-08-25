-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "clientsLabel" TEXT;

-- CreateTable
CREATE TABLE "contact_cta" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "note" TEXT,
    "buttonLabel" TEXT NOT NULL,
    "buttonUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_cta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_avatars" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "client_avatars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_avatars_displayOrder_idx" ON "client_avatars"("displayOrder");

-- AddForeignKey
ALTER TABLE "client_avatars" ADD CONSTRAINT "client_avatars_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
