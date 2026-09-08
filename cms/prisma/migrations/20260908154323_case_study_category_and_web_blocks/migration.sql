-- CreateEnum
CREATE TYPE "CaseStudyCategory" AS ENUM ('WEB', 'APP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BlockType" ADD VALUE 'HERO_STAT';
ALTER TYPE "BlockType" ADD VALUE 'RESEARCH_INTRO';
ALTER TYPE "BlockType" ADD VALUE 'INSIGHT_FINDING';
ALTER TYPE "BlockType" ADD VALUE 'FULL_WIDTH_VIDEO';

-- AlterTable
ALTER TABLE "case_studies" ADD COLUMN     "category" "CaseStudyCategory" NOT NULL DEFAULT 'WEB';
