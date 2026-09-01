-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN "sandboxId" TEXT;

-- CreateIndex
CREATE INDEX "MediaAsset_userId_sandboxId_idx" ON "MediaAsset"("userId", "sandboxId");
