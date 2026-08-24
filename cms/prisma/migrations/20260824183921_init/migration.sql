-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'IMAGE', 'IMAGE_TEXT', 'GALLERY', 'FULL_WIDTH_IMAGE', 'VIDEO', 'QUOTE', 'STATS', 'CTA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OWNER',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "renditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "siteName" TEXT NOT NULL,
    "siteDescription" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "location" TEXT,
    "availabilityLabel" TEXT,
    "defaultSeoTitle" TEXT,
    "defaultSeoDesc" TEXT,
    "ogImageId" TEXT,
    "faviconId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_hero" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "eyebrow" TEXT,
    "titlePrefix" TEXT NOT NULL,
    "typingWords" TEXT[],
    "description" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaUrl" TEXT,
    "portraitId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_content" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heading" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "portraitId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "description" TEXT,
    "email" TEXT NOT NULL,
    "copyright" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_cards" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "blurb" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stat_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "highlights" TEXT[],
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "logoId" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tribute" TEXT NOT NULL,
    "photoId" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "imageId" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconId" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "quote" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "avatarId" TEXT,
    "companyLogoId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "category" TEXT,
    "industry" TEXT,
    "year" TEXT,
    "role" TEXT,
    "technologies" TEXT[],
    "externalUrl" TEXT,
    "aspectRatio" TEXT,
    "thumbnailId" TEXT,
    "heroId" TEXT,
    "caseStudyId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_studies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "client" TEXT,
    "industry" TEXT,
    "projectType" TEXT,
    "year" TEXT,
    "duration" TEXT,
    "role" TEXT,
    "team" TEXT,
    "externalUrl" TEXT,
    "prototypeUrl" TEXT,
    "heroTitle" TEXT,
    "heroDescription" TEXT,
    "heroId" TEXT,
    "thumbnailId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_study_blocks" (
    "id" TEXT NOT NULL,
    "caseStudyId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "data" JSONB NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_study_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "ogImageId" TEXT,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "login_attempts_email_createdAt_idx" ON "login_attempts"("email", "createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_ip_createdAt_idx" ON "login_attempts"("ip", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_storageKey_key" ON "media"("storageKey");

-- CreateIndex
CREATE INDEX "navigation_items_displayOrder_idx" ON "navigation_items"("displayOrder");

-- CreateIndex
CREATE INDEX "social_links_displayOrder_idx" ON "social_links"("displayOrder");

-- CreateIndex
CREATE INDEX "stat_cards_displayOrder_idx" ON "stat_cards"("displayOrder");

-- CreateIndex
CREATE INDEX "experience_displayOrder_idx" ON "experience"("displayOrder");

-- CreateIndex
CREATE INDEX "mentors_displayOrder_idx" ON "mentors"("displayOrder");

-- CreateIndex
CREATE INDEX "gallery_items_displayOrder_idx" ON "gallery_items"("displayOrder");

-- CreateIndex
CREATE INDEX "services_displayOrder_idx" ON "services"("displayOrder");

-- CreateIndex
CREATE INDEX "testimonials_displayOrder_idx" ON "testimonials"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "projects_caseStudyId_key" ON "projects"("caseStudyId");

-- CreateIndex
CREATE INDEX "projects_status_displayOrder_idx" ON "projects"("status", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_slug_key" ON "case_studies"("slug");

-- CreateIndex
CREATE INDEX "case_studies_status_idx" ON "case_studies"("status");

-- CreateIndex
CREATE INDEX "case_study_blocks_caseStudyId_displayOrder_idx" ON "case_study_blocks"("caseStudyId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_entityType_entityId_key" ON "seo_metadata"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_faviconId_fkey" FOREIGN KEY ("faviconId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_hero" ADD CONSTRAINT "homepage_hero_portraitId_fkey" FOREIGN KEY ("portraitId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_content" ADD CONSTRAINT "about_content_portraitId_fkey" FOREIGN KEY ("portraitId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience" ADD CONSTRAINT "experience_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_companyLogoId_fkey" FOREIGN KEY ("companyLogoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_study_blocks" ADD CONSTRAINT "case_study_blocks_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "case_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_metadata" ADD CONSTRAINT "seo_metadata_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
